/**
 * RecapMCP - Recovery Mode Functions
 * Specialized recovery features for Claude timeouts and disruptions
 */

import * as fs from 'fs';
import * as path from 'path';
import { EnhancedToolCall, Session, RecoveryContext, InterruptedOperation } from './types.js';

// =============================================================================
// Recovery Detection
// =============================================================================

export function detectInterruptedSession(sessions: Session[]): Session | null {
  if (sessions.length === 0) return null;
  
  const recentSession = sessions[sessions.length - 1];
  const now = new Date();
  const sessionAge = (now.getTime() - recentSession.endTime.getTime()) / 1000 / 60; // minutes
  
  // Session is considered interrupted if:
  // 1. Last activity was < 10 minutes ago (likely still working)
  // 2. Session has active operations without completion markers
  if (sessionAge < 10 && hasIncompleteOperations(recentSession)) {
    return recentSession;
  }
  
  return null;
}

function hasIncompleteOperations(session: Session): boolean {
  const toolSequence = session.toolCalls.map(call => call.toolName);
  
  // Check for common incomplete patterns
  const incompletePatterns = [
    ['edit_block'], // Edit without save/test
    ['write_file'], // Write without verification
    ['execute_command'], // Command without result check
    ['search_code'], // Search without action
  ];
  
  // Check if session ends with potentially incomplete operation
  const lastTools = toolSequence.slice(-2);
  return incompletePatterns.some(pattern => 
    pattern.every(tool => lastTools.includes(tool))
  );
}

// =============================================================================
// Recovery Context Generation
// =============================================================================

export function generateRecoveryContext(
  session: Session, 
  toolCalls: EnhancedToolCall[]
): RecoveryContext {
  const lastActivity = session.toolCalls[session.toolCalls.length - 1];
  const pendingOperations = extractPendingOperations(session);
  const uncommittedChanges = detectUncommittedChanges(session);
  const lastError = findLastError(session);
  
  return {
    sessionId: session.id,
    lastActivityTime: lastActivity.timestamp,
    lastToolUsed: lastActivity.toolName,
    lastFile: extractLastFile(session),
    workingDirectory: extractWorkingDirectory(session),
    pendingOperations,
    uncommittedChanges,
    lastError,
    suggestedActions: generateSuggestedActions(session, pendingOperations)
  };
}

function extractPendingOperations(session: Session): InterruptedOperation[] {
  const operations: InterruptedOperation[] = [];
  const toolCalls = session.toolCalls;
  
  for (let i = 0; i < toolCalls.length; i++) {
    const call = toolCalls[i];
    
    // Check for edits without saves
    if (call.toolName === 'edit_block' || call.toolName === 'write_file') {
      const hasFollowupTest = toolCalls.slice(i + 1).some(c => 
        c.toolName === 'execute_command' && 
        (c.arguments?.command?.includes('test') || c.arguments?.command?.includes('npm'))
      );
      
      if (!hasFollowupTest) {
        operations.push({
          type: 'unsaved_edit',
          file: call.arguments?.file_path || call.arguments?.path || 'unknown',
          timestamp: call.timestamp,
          description: 'File edited but not tested'
        });
      }
    }
    
    // Check for searches without actions
    if (call.toolName === 'search_code' && i === toolCalls.length - 1) {
      operations.push({
        type: 'pending_search',
        pattern: call.arguments?.pattern || 'unknown',
        timestamp: call.timestamp,
        description: 'Search performed but no action taken'
      });
    }
  }
  
  return operations;
}

function detectUncommittedChanges(session: Session): string[] {
  const editedFiles = new Set<string>();
  
  session.toolCalls.forEach(call => {
    if (call.toolName === 'edit_block' || call.toolName === 'write_file') {
      const file = call.arguments?.file_path || call.arguments?.path;
      if (file) editedFiles.add(file);
    }
  });
  
  // Check if git commit was run after edits
  const hasCommit = session.toolCalls.some(call => 
    call.toolName === 'execute_command' && 
    call.arguments?.command?.includes('git commit')
  );
  
  return hasCommit ? [] : Array.from(editedFiles);
}

function findLastError(session: Session): string | null {
  // Look for error patterns in recent commands
  const recentCommands = session.toolCalls
    .filter(call => call.toolName === 'execute_command')
    .slice(-3);
  
  for (const cmd of recentCommands) {
    if (cmd.arguments?.command?.includes('test') || 
        cmd.arguments?.command?.includes('build')) {
      // Would need actual command output to detect errors
      // For now, check for error-related searches after commands
      const cmdIndex = session.toolCalls.indexOf(cmd);
      const followupSearch = session.toolCalls.slice(cmdIndex + 1).find(call =>
        call.toolName === 'search_code' && 
        (call.arguments?.pattern?.includes('error') || 
         call.arguments?.pattern?.includes('undefined'))
      );
      
      if (followupSearch) {
        return `Possible error after ${cmd.arguments?.command}`;
      }
    }
  }
  
  return null;
}

function extractLastFile(session: Session): string | null {
  for (let i = session.toolCalls.length - 1; i >= 0; i--) {
    const call = session.toolCalls[i];
    if (call.contextInfo?.files && call.contextInfo.files.length > 0) {
      return call.contextInfo.files[0];
    }
    if (call.arguments?.file_path || call.arguments?.path) {
      return call.arguments.file_path || call.arguments.path;
    }
  }
  return null;
}

function extractWorkingDirectory(session: Session): string | null {
  // Try to extract from project name and common paths
  if (session.primaryProject) {
    return `/Users/ehukaimedia/Desktop/AI-Applications/Node/${session.primaryProject}`;
  }
  
  // Extract from file paths
  const filePaths = session.filesAccessed.filter(f => f.startsWith('/'));
  if (filePaths.length > 0) {
    const commonPath = findCommonPath(filePaths);
    return commonPath;
  }
  
  return null;
}

function findCommonPath(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return path.dirname(paths[0]);
  
  const parts = paths[0].split('/');
  let commonPath = '';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (paths.every(p => p.split('/')[i] === part)) {
      commonPath += (commonPath ? '/' : '') + part;
    } else {
      break;
    }
  }
  
  return commonPath || '/';
}

function generateSuggestedActions(
  session: Session, 
  pendingOps: InterruptedOperation[]
): string[] {
  const suggestions: string[] = [];
  
  // Based on pending operations
  pendingOps.forEach(op => {
    if (op.type === 'unsaved_edit') {
      suggestions.push(`Test changes to ${op.file}`);
      suggestions.push(`Review and commit ${op.file}`);
    } else if (op.type === 'pending_search') {
      suggestions.push(`Review search results for "${op.pattern}"`);
      suggestions.push(`Take action on search findings`);
    }
  });
  
  // Based on workflow patterns
  if (session.workflowPatterns.includes('DEBUGGING')) {
    suggestions.push('Continue debugging the identified issue');
    suggestions.push('Run tests to verify fixes');
  }
  
  if (session.workflowPatterns.includes('EDITING')) {
    suggestions.push('Complete the current implementation');
    suggestions.push('Add tests for new functionality');
  }
  
  // General recovery suggestions
  if (suggestions.length === 0) {
    suggestions.push('Review recent changes');
    suggestions.push('Check for uncommitted work');
    suggestions.push('Continue with the previous task');
  }
  
  return suggestions.slice(0, 3); // Top 3 suggestions
}

// =============================================================================
// Quick Recovery Summary
// =============================================================================

export function generateQuickRecovery(
  session: Session,
  context: RecoveryContext
): string {
  const timeSinceLastActivity = Math.round(
    (new Date().getTime() - context.lastActivityTime.getTime()) / 1000 / 60
  );
  
  let output = 'QUICK RECOVERY\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  output += `Last Activity: ${timeSinceLastActivity} minutes ago\n`;
  output += `Working On: ${session.primaryProject || 'Unknown Project'}\n`;
  output += `Last Tool: ${context.lastToolUsed}\n`;
  
  if (context.lastFile) {
    output += `Active File: ${context.lastFile}\n`;
  }
  
  if (context.workingDirectory) {
    output += `Directory: ${context.workingDirectory}\n`;
  }
  
  if (context.pendingOperations.length > 0) {
    output += '\nPENDING OPERATIONS:\n';
    context.pendingOperations.forEach(op => {
      output += `• ${op.description}\n`;
    });
  }
  
  if (context.uncommittedChanges.length > 0) {
    output += '\nUNCOMMITTED FILES:\n';
    context.uncommittedChanges.slice(0, 5).forEach(file => {
      output += `• ${file}\n`;
    });
  }
  
  if (context.lastError) {
    output += `\nLAST ERROR: ${context.lastError}\n`;
  }
  
  output += '\nSUGGESTED NEXT STEPS:\n';
  context.suggestedActions.forEach((action, i) => {
    output += `${i + 1}. ${action}\n`;
  });
  
  return output;
}

// =============================================================================
// State Checkpoint System
// =============================================================================

export async function saveStateCheckpoint(
  session: Session,
  checkpointPath: string
): Promise<void> {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    sessionId: session.id,
    project: session.primaryProject,
    workflowPatterns: session.workflowPatterns,
    filesAccessed: session.filesAccessed,
    lastTools: session.toolCalls.slice(-5).map(call => ({
      tool: call.toolName,
      timestamp: call.timestamp,
      args: call.arguments
    })),
    intent: session.primaryIntent,
    intentConfidence: session.intentConfidence
  };
  
  await fs.promises.writeFile(
    checkpointPath,
    JSON.stringify(checkpoint, null, 2),
    'utf8'
  );
}

export async function loadLastCheckpoint(
  checkpointPath: string
): Promise<any | null> {
  try {
    const content = await fs.promises.readFile(checkpointPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
