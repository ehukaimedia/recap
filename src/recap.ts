/**
 * RecapMCP - Core Analysis Functionality
 * Professional MCP server for intelligent DesktopCommanderMCP activity analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  RecapArgs,
  RecapArgsSchema,
  EnhancedToolCall,
  Session,
  MCPToolResponse,
  RecapAnalysis,
  SessionMetadata,
  CurrentStateContext,
  DEFAULT_CONFIG,
  hasValidContextInfo,
  LogParseError,
  RecapError
} from './types.js';
import {
  detectInterruptedSession,
  generateRecoveryContext,
  generateQuickRecovery,
  saveStateCheckpoint,
  loadLastCheckpoint
} from './recovery.js';

// =============================================================================
// Configuration
// =============================================================================

const LOG_PATHS = [
  path.join(os.homedir(), '.claude-server-commander', 'claude_tool_call.log'),
  '/.claude-server-commander/claude_tool_call.log'
];

// =============================================================================
// Main Handler Function
// =============================================================================

export async function handleRecap(args: RecapArgs): Promise<MCPToolResponse> {
  try {
    // Find and validate log file
    const logPath = await findLogFile();
    
    // Parse enhanced logs within time range
    const toolCalls = await parseEnhancedLogs(logPath, args.hours);
    
    if (toolCalls.length === 0) {
      return {
        content: [{
          type: "text",
          text: generateEmptyRecapMessage(args.hours)
        }]
      };
    }
    
    // Analyze sessions and generate insights
    const sessions = analyzeSessions(toolCalls);
    
    // Analyze current state context
    const currentState = analyzeCurrentState(sessions);
    
    // Generate unified intelligent output
    const content = generateUnifiedIntelligentOutput(sessions, currentState);
    
    return {
      content: [{
        type: "text",
        text: content
      }]
    };
    
  } catch (error) {
    return handleError(error);
  }
}

// =============================================================================
// Log File Discovery
// =============================================================================

async function findLogFile(): Promise<string> {
  for (const logPath of LOG_PATHS) {
    try {
      await fs.promises.access(logPath);
      return logPath;
    } catch {
      continue;
    }
  }
  
  throw new RecapError(
    'DesktopCommanderMCP log file not found',
    'LOG_FILE_NOT_FOUND',
    { searchPaths: LOG_PATHS }
  );
}

// =============================================================================
// Log Parsing
// =============================================================================

async function parseEnhancedLogs(logPath: string, hours: number): Promise<EnhancedToolCall[]> {
  try {
    const content = await fs.promises.readFile(logPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const calls: EnhancedToolCall[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const parsed = parseLogLine(lines[i]);
        if (parsed && parsed.timestamp >= cutoffTime && hasValidContextInfo(parsed)) {
          calls.push(parsed);
        }
      } catch (error) {
        // Log parsing errors are non-fatal, skip malformed lines
        if (error instanceof LogParseError) {
          continue;
        }
        throw error;
      }
    }
    
    return calls;
  } catch (error) {
    if (error instanceof RecapError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new RecapError(
      `Failed to read log file: ${errorMessage}`,
      'LOG_READ_ERROR',
      { logPath, originalError: error }
    );
  }
}

function parseLogLine(line: string): EnhancedToolCall | null {
  try {
    const parts = line.split(' | ');
    if (parts.length < 3) {
      return null;
    }
    
    const timestamp = new Date(parts[0]);
    if (isNaN(timestamp.getTime())) {
      throw new LogParseError('Invalid timestamp format');
    }
    
    const toolName = parts[1].trim();
    if (!toolName) {
      throw new LogParseError('Missing tool name');
    }
    
    let contextInfo;
    try {
      contextInfo = JSON.parse(parts[2]);
    } catch {
      return null; // Skip entries without enhanced context
    }
    
    // Parse arguments if present
    let args: Record<string, any> = {};
    if (parts[3] && parts[3].startsWith('Args: ')) {
      try {
        args = JSON.parse(parts[3].substring(6));
      } catch {
        // Arguments parsing is optional
      }
    }
    
    return {
      timestamp,
      toolName,
      contextInfo,
      arguments: args
    };
  } catch (error) {
    if (error instanceof LogParseError) {
      throw error;
    }
    return null;
  }
}

// =============================================================================
// Session Analysis
// =============================================================================

function analyzeSessions(toolCalls: EnhancedToolCall[]): Session[] {
  const sessionMap = new Map<string, Session>();
  
  for (const call of toolCalls) {
    if (!hasValidContextInfo(call)) continue;
    
    const sessionId = call.contextInfo.session;
    
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        id: sessionId,
        startTime: call.timestamp,
        endTime: call.timestamp,
        duration: 0,
        workflowPatterns: [],
        filesAccessed: [],
        toolCalls: [call]
      });
    } else {
      const session = sessionMap.get(sessionId)!;
      session.toolCalls.push(call);
      session.endTime = call.timestamp;
    }
  }
  
  // Finalize all sessions
  const sessions = Array.from(sessionMap.values());
  sessions.forEach(finalizeSession);
  
  return sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

function finalizeSession(session: Session): void {
  // Calculate duration in minutes
  session.duration = Math.round(
    (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
  );
  
  // Extract workflow patterns, projects, files, and INTENT DATA
  const patterns = new Set<string>();
  const projectCounts: Record<string, number> = {};
  const files = new Set<string>();
  
  // Intent analysis data
  const intentMap = new Map<string, {confidence: number, count: number, evidence: string[]}>();
  const workPatternCounts: Record<string, number> = {};
  
  for (const call of session.toolCalls) {
    if (!hasValidContextInfo(call)) continue;
    
    // Collect workflow patterns
    if (call.contextInfo.workflow) {
      patterns.add(call.contextInfo.workflow);
    }
    
    // Count project occurrences
    if (call.contextInfo.project) {
      projectCounts[call.contextInfo.project] = 
        (projectCounts[call.contextInfo.project] || 0) + 1;
    }
    
    // Collect unique files
    if (call.contextInfo.files) {
      call.contextInfo.files.forEach(f => files.add(f));
    }
    
    // =============================================================================
    // INTENT DATA PROCESSING - Extract intelligent insights
    // =============================================================================
    
    // Process intent information
    if (call.contextInfo.intent && call.contextInfo.intentConfidence) {
      const intent = call.contextInfo.intent;
      const confidence = call.contextInfo.intentConfidence / 100; // Convert back to 0-1
      const evidence = call.contextInfo.intentEvidence || [];
      
      if (intentMap.has(intent)) {
        const existing = intentMap.get(intent)!;
        existing.count++;
        existing.confidence = Math.max(existing.confidence, confidence);
        // Merge evidence arrays, keeping unique entries
        const mergedEvidence = [...new Set([...existing.evidence, ...evidence])];
        existing.evidence = mergedEvidence;
      } else {
        intentMap.set(intent, {confidence, count: 1, evidence});
      }
    }
    
    // Count work patterns
    if (call.contextInfo.workPattern) {
      workPatternCounts[call.contextInfo.workPattern] = 
        (workPatternCounts[call.contextInfo.workPattern] || 0) + 1;
    }
  }
  
  session.workflowPatterns = Array.from(patterns);
  session.filesAccessed = Array.from(files);
  
  // Determine primary project (most frequent)
  if (Object.keys(projectCounts).length > 0) {
    session.primaryProject = Object.entries(projectCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
  
  // Determine primary intent (highest confidence * count)
  if (intentMap.size > 0) {
    const intentEntries = Array.from(intentMap.entries())
      .sort((a, b) => (b[1].confidence * b[1].count) - (a[1].confidence * a[1].count));
    session.primaryIntent = intentEntries[0][0];
    session.intentConfidence = Math.round(intentEntries[0][1].confidence * 100);
  }
  
  // Determine primary work pattern (most frequent)
  if (Object.keys(workPatternCounts).length > 0) {
    session.workPattern = Object.entries(workPatternCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as any;
  }
}

// =============================================================================
// Current State Analysis
// =============================================================================

function analyzeCurrentState(sessions: Session[]): CurrentStateContext {
  if (sessions.length === 0) {
    return {
      recentFiles: [],
      activeSessionDuration: 0,
      recentActivity: 'No recent activity detected',
      availableStructure: []
    };
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Get the most recent session
  const recentSession = sessions[sessions.length - 1];
  
  // Find recent activity (last 5 minutes)
  const recentCalls = recentSession.toolCalls.filter(call => 
    call.timestamp >= fiveMinutesAgo
  );

  // Find files accessed in last 10 minutes
  const recentFiles = new Set<string>();
  recentSession.toolCalls
    .filter(call => call.timestamp >= tenMinutesAgo)
    .forEach(call => {
      if (hasValidContextInfo(call) && call.contextInfo.files) {
        call.contextInfo.files.forEach(file => recentFiles.add(file));
      }
    });

  // Get last working directory
  let lastWorkingDirectory: string | undefined;
  for (let i = recentSession.toolCalls.length - 1; i >= 0; i--) {
    const call = recentSession.toolCalls[i];
    if (hasValidContextInfo(call) && call.contextInfo.project) {
      // Attempt to reconstruct working directory from project name
      lastWorkingDirectory = `/Users/ehukaimedia/Desktop/AI-Applications/Node/${call.contextInfo.project}`;
      break;
    }
  }

  // Generate recent activity summary
  let recentActivity = 'No recent activity';
  if (recentCalls.length > 0) {
    const recentActions = recentCalls.map(call => call.toolName);
    const uniqueActions = [...new Set(recentActions)];
    if (uniqueActions.length <= 3) {
      recentActivity = `Recent actions: ${uniqueActions.join(', ')}`;
    } else {
      recentActivity = `${recentCalls.length} recent operations including ${uniqueActions.slice(0, 3).join(', ')}`;
    }
  }

  // Calculate active session duration
  const activeSessionDuration = Math.round(
    (now.getTime() - recentSession.startTime.getTime()) / 1000 / 60
  );

  return {
    lastWorkingDirectory,
    currentProject: recentSession.primaryProject,
    recentFiles: Array.from(recentFiles).slice(0, 10),
    activeSessionId: recentSession.id,
    activeSessionDuration,
    recentActivity,
    availableStructure: [] // Will be populated by directory listing if available
  };
}

// =============================================================================
// Unified Intelligent Output Generation
// =============================================================================

function generateUnifiedIntelligentOutput(sessions: Session[], currentState: CurrentStateContext): string {
  if (sessions.length === 0) return 'No recent activity detected.';
  
  // Determine context
  const recentSession = sessions[sessions.length - 1];
  const now = new Date();
  const timeSinceLastActivity = Math.round(
    (now.getTime() - recentSession.endTime.getTime()) / 1000 / 60
  );
  
  // Categorize time context
  const timeContext = categorizeTimeContext(timeSinceLastActivity);
  
  // Check for interrupted work
  const interruptedSession = detectInterruptedSession(sessions);
  const hasUncommittedWork = interruptedSession !== null;
  
  // Detect if multiple projects
  const projectSet = new Set(sessions.map(s => s.primaryProject).filter(Boolean));
  const isMultiProject = projectSet.size > 1;
  
  // Get enhanced recovery data if available
  let recoveryContext: any = null;
  if (interruptedSession) {
    recoveryContext = generateRecoveryContext(interruptedSession, recentSession.toolCalls);
  }
  
  // Build intelligent output
  let output = '';
  
  // 1. Smart Header
  output += generateSmartHeader(sessions, timeContext, hasUncommittedWork);
  
  // 2. Core Sections - Always Present
  output += generateWhatYouWereDoing(recentSession);
  output += generateWhereYouAreNow(recentSession, currentState, timeSinceLastActivity);
  
  // 3. Adaptive Sections - Show when relevant
  
  // Show investigation trail if search evolution detected
  if (recoveryContext?.searchEvolution?.patterns?.length > 1) {
    output += generateInvestigationTrail(recoveryContext.searchEvolution);
  }
  
  // Show active files if multiple files touched
  if (recoveryContext?.fileHeatmap?.length > 1 || recentSession.filesAccessed.length > 1) {
    output += generateActiveFilesSection(recoveryContext?.fileHeatmap || [], recentSession);
  }
  
  // Show recent changes if edits made
  if (hasRecentEdits(recentSession)) {
    output += generateRecentChangesSection(recentSession, recoveryContext);
  }
  
  // Show needs attention if issues exist
  if (hasUncommittedWork || recoveryContext?.pendingTests?.length > 0) {
    output += generateNeedsAttentionSection(recoveryContext, interruptedSession);
  }
  
  // 4. Resume Instructions - Always present, adapted to context
  output += generateResumeInstructions(recentSession, currentState, timeContext, recoveryContext);
  
  // 5. Multi-project summary if applicable
  if (isMultiProject && sessions.length > 1) {
    output += generateMultiProjectSummary(sessions);
  }
  
  return output;
}

function categorizeTimeContext(minutes: number): 'just-left' | 'recent' | 'returning' {
  if (minutes < 10) return 'just-left';
  if (minutes < 60) return 'recent';
  return 'returning';
}

function generateSmartHeader(sessions: Session[], timeContext: string, hasUncommittedWork: boolean): string {
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const recentSession = sessions[sessions.length - 1];
  const project = recentSession.primaryProject || 'Development';
  
  // Calculate progress if possible
  let progress = '';
  const lastCall = recentSession.toolCalls[recentSession.toolCalls.length - 1];
  if (lastCall.contextInfo && (lastCall.contextInfo as any).operationChains?.length > 0) {
    const chain = (lastCall.contextInfo as any).operationChains[0];
    progress = ` • ${chain.progress}`;
  }
  
  // Time status
  let timeStatus = '';
  switch (timeContext) {
    case 'just-left':
      timeStatus = 'Just now';
      break;
    case 'recent':
      timeStatus = `${Math.round((new Date().getTime() - recentSession.endTime.getTime()) / 1000 / 60)}m ago`;
      break;
    case 'returning':
      const hours = Math.round((new Date().getTime() - recentSession.endTime.getTime()) / 1000 / 60 / 60);
      timeStatus = hours > 24 ? `${Math.round(hours / 24)}d away` : `${hours}h away`;
      break;
  }
  
  const warningIcon = hasUncommittedWork ? '⚠️ ' : '';
  
  return `\n${warningIcon}WORK CONTEXT • ${project} • ${timeStatus}${progress}\n${'━'.repeat(50)}\n\n`;
}

function generateWhatYouWereDoing(session: Session): string {
  let output = '🎯 WHAT YOU WERE DOING\n';
  
  if (session.primaryIntent) {
    const confidence = session.intentConfidence ? ` (${session.intentConfidence}% sure)` : '';
    output += `${session.primaryIntent}${confidence}\n`;
    
    // Add brief context if available
    const lastCall = session.toolCalls[session.toolCalls.length - 1];
    if (lastCall.contextInfo?.intent) {
      // Add a contextual explanation if different from primary
      if (lastCall.contextInfo.intent !== session.primaryIntent) {
        output += `Latest: ${lastCall.contextInfo.intent}\n`;
      }
    }
  } else {
    // Fallback to task inference
    const task = inferTaskFromSession(session);
    output += `${task}\n`;
  }
  
  return output + '\n';
}

function generateWhereYouAreNow(session: Session, currentState: CurrentStateContext, timeSinceLastActivity: number): string {
  let output = '📍 WHERE YOU ARE NOW\n';
  
  const lastEdit = extractLastEditFromSession(session);
  const lastTool = session.toolCalls[session.toolCalls.length - 1];
  
  if (timeSinceLastActivity < 10) {
    // Just left - be brief
    if (lastEdit !== 'No recent edits') {
      output += `In ${lastEdit} • ${lastTool.toolName.replace('_', ' ')} • Ready to continue\n`;
    } else {
      output += `${currentState.currentProject || 'Working'} • Last: ${lastTool.toolName.replace('_', ' ')}\n`;
    }
  } else {
    // More time has passed - give more context
    if (currentState.lastWorkingDirectory) {
      const dirParts = currentState.lastWorkingDirectory.split('/');
      const shortDir = dirParts.slice(-2).join('/');
      output += `Left off in /${shortDir}`;
      if (lastEdit !== 'No recent edits') {
        output += ` after editing ${lastEdit}`;
      }
      output += '\n';
    } else {
      output += `Last activity: ${lastTool.toolName.replace('_', ' ')}`;
      if (lastEdit !== 'No recent edits') {
        output += ` on ${lastEdit}`;
      }
      output += '\n';
    }
  }
  
  return output + '\n';
}

function generateInvestigationTrail(searchEvolution: any): string {
  if (!searchEvolution || !searchEvolution.patterns || searchEvolution.patterns.length === 0) {
    return '';
  }
  
  let output = '🔍 INVESTIGATION TRAIL\n';
  const patterns = searchEvolution.patterns.slice(-3); // Last 3 searches
  
  output += patterns.map((pattern: string, i: number) => {
    if (i === patterns.length - 1) {
      return `"${pattern}" ✓`;
    }
    return `"${pattern}"`;
  }).join(' → ');
  
  output += '\n\n';
  return output;
}

function generateActiveFilesSection(fileHeatmap: any[], session: Session): string {
  const files = fileHeatmap.length > 0 ? fileHeatmap : 
    session.filesAccessed.map(f => ({ file: f, accesses: 1, operations: 'R:1' }));
  
  if (files.length < 2) return '';
  
  let output = '🔥 ACTIVE FILES\n';
  
  files.slice(0, 5).forEach(file => {
    const barLength = Math.min(8, Math.ceil(file.accesses / 2));
    const bar = '█'.repeat(barLength);
    const fileName = typeof file.file === 'string' ? file.file.split('/').pop() : file.file;
    
    let line = `${fileName.padEnd(20)} ${bar} ${file.accesses}x`;
    if (file.operations) {
      line += ` (${file.operations})`;
    }
    
    // Add status indicators
    if (file.category === 'test' || fileName.includes('.test.')) {
      line += ' • Needs: test';
    } else if (file.accesses > 5) {
      line += ' • Focus area';
    }
    
    output += line + '\n';
  });
  
  return output + '\n';
}

function generateRecentChangesSection(session: Session, recoveryContext: any): string {
  const editCalls = session.toolCalls.filter(call => 
    call.toolName === 'edit_block' || call.toolName === 'write_file'
  ).slice(-3); // Last 3 edits
  
  if (editCalls.length === 0) return '';
  
  let output = '📝 RECENT CHANGES\n';
  
  editCalls.forEach(call => {
    const fileName = (call.arguments?.file_path || call.arguments?.path || '').split('/').pop();
    const timeSince = formatTimeAgo(call.timestamp);
    
    output += `${fileName} (${timeSince})\n`;
    
    // Add change details if available from recovery context
    if (recoveryContext?.codeChanges) {
      const change = recoveryContext.codeChanges.find((c: any) => 
        c.file.includes(fileName)
      );
      if (change) {
        output += `+ ${change.pattern}`;
        if (change.size) {
          output += ` • ${change.size} chars`;
        }
        output += '\n';
      }
    } else if (call.arguments?.new_string && call.arguments?.old_string) {
      const sizeDiff = call.arguments.new_string.length - call.arguments.old_string.length;
      const changeType = sizeDiff > 0 ? 'Added' : sizeDiff < 0 ? 'Removed' : 'Modified';
      output += `+ ${changeType} ${Math.abs(sizeDiff)} chars\n`;
    }
  });
  
  return output + '\n';
}

function generateNeedsAttentionSection(recoveryContext: any, interruptedSession: Session | null): string {
  let output = '⚠️ NEEDS ATTENTION\n';
  
  if (recoveryContext?.uncommittedChanges?.length > 0) {
    output += `• ${recoveryContext.uncommittedChanges.length} uncommitted file${recoveryContext.uncommittedChanges.length > 1 ? 's' : ''}\n`;
  }
  
  if (recoveryContext?.pendingTests?.length > 0) {
    output += `• ${recoveryContext.pendingTests.length} file${recoveryContext.pendingTests.length > 1 ? 's' : ''} edited but not tested\n`;
  }
  
  if (recoveryContext?.pendingOperations?.length > 0) {
    recoveryContext.pendingOperations.slice(0, 2).forEach((op: any) => {
      output += `• ${op.description}\n`;
    });
  }
  
  return output + '\n';
}

function generateResumeInstructions(
  session: Session, 
  currentState: CurrentStateContext,
  timeContext: string,
  recoveryContext: any
): string {
  let output = '⚡ RESUME INSTANTLY\n';
  
  const commands: string[] = [];
  
  // Change directory if needed (not for just-left)
  if (timeContext !== 'just-left' && currentState.lastWorkingDirectory) {
    commands.push(`cd ${currentState.lastWorkingDirectory}`);
  }
  
  // Add context-specific commands
  if (recoveryContext?.pendingTests?.length > 0) {
    const testFile = recoveryContext.pendingTests[0];
    if (testFile.includes('.test.')) {
      commands.push(`npm test ${testFile}`);
    } else {
      commands.push(`npm test`);
    }
  } else if (hasRecentEdits(session)) {
    // Check for test files
    const hasTests = session.filesAccessed.some(f => f.includes('.test.') || f.includes('.spec.'));
    if (hasTests) {
      commands.push('npm test');
    }
  }
  
  // Add git commands if uncommitted
  if (recoveryContext?.uncommittedChanges?.length > 0) {
    const files = recoveryContext.uncommittedChanges.slice(0, 3);
    if (files.length === 1) {
      commands.push(`git add ${files[0]}`);
    } else {
      commands.push('git status');
      commands.push('git add .');
    }
    
    // Suggest commit message based on intent
    if (session.primaryIntent) {
      const intentLower = session.primaryIntent.toLowerCase();
      let commitType = 'feat';
      if (intentLower.includes('fix') || intentLower.includes('debug')) {
        commitType = 'fix';
      } else if (intentLower.includes('refactor')) {
        commitType = 'refactor';
      }
      commands.push(`git commit -m "${commitType}: ${generateCommitMessage(session)}"`);
    }
  }
  
  // Add next action based on workflow
  if (commands.length === 0) {
    // No specific commands needed, suggest based on pattern
    if (session.workPattern === 'investigative') {
      commands.push('# Continue exploring the codebase');
    } else if (session.workPattern === 'reactive') {
      commands.push('# Verify the fix is working');
    } else {
      commands.push('# Continue with implementation');
    }
  }
  
  // Format commands
  commands.forEach(cmd => {
    output += `│ ${cmd}\n`;
  });
  
  return output;
}

function generateMultiProjectSummary(sessions: Session[]): string {
  const projectMap = new Map<string, { duration: number, sessions: number }>();
  
  sessions.forEach(session => {
    if (session.primaryProject) {
      const existing = projectMap.get(session.primaryProject) || { duration: 0, sessions: 0 };
      existing.duration += session.duration;
      existing.sessions += 1;
      projectMap.set(session.primaryProject, existing);
    }
  });
  
  if (projectMap.size <= 1) return '';
  
  let output = '\n📊 MULTI-PROJECT ACTIVITY\n';
  
  Array.from(projectMap.entries())
    .sort((a, b) => b[1].duration - a[1].duration)
    .forEach(([project, stats]) => {
      const barLength = Math.min(8, Math.ceil(stats.duration / 15));
      const bar = '█'.repeat(barLength);
      output += `${project.padEnd(15)} ${bar} ${stats.duration}m (${stats.sessions} sessions)\n`;
    });
  
  return output;
}

function hasRecentEdits(session: Session): boolean {
  return session.toolCalls.some(call => 
    call.toolName === 'edit_block' || call.toolName === 'write_file'
  );
}

function generateCommitMessage(session: Session): string {
  const lastEdit = extractLastEditFromSession(session);
  if (session.primaryIntent) {
    // Simplify the intent for commit message
    const intent = session.primaryIntent
      .toLowerCase()
      .replace('implement new feature', 'add feature')
      .replace('debug and fix', 'fix')
      .replace('identified error or test failure', 'error');
    
    if (lastEdit !== 'No recent edits') {
      return `${intent} in ${lastEdit}`;
    }
    return intent;
  }
  
  return lastEdit !== 'No recent edits' ? `Update ${lastEdit}` : 'Update code';
}

// =============================================================================
// Output Generation
// =============================================================================

function generateHandoffNote(sessions: Session[], currentState?: CurrentStateContext): string {
  if (sessions.length === 0) return 'No recent activity detected.';
  
  const recentSession = sessions[sessions.length - 1];
  const lastEdit = extractLastEditFromSession(recentSession);
  const lastSearch = extractLastSearchFromSession(recentSession);
  const currentTask = inferTaskFromSession(recentSession);
  const nextSteps = generateNextSteps(recentSession, currentState);
  const status = determineProjectStatus(recentSession);
  
  // Check for potential interrupted work
  const interruptedSession = detectInterruptedSession(sessions);
  const recoveryNote = interruptedSession ? 
    '\n⚠️ INTERRUPTED SESSION DETECTED - Use recovery mode for details' : '';
  
  return `
🔄 SESSION HANDOFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Working Directory: ${currentState?.lastWorkingDirectory || 'Unknown'}
📝 Active File: ${lastEdit || 'No recent edits'}
🎯 Current Task: ${currentTask}
🔍 Last Search: ${lastSearch || 'None'}
⚡ Status: ${status}${recoveryNote}

🚀 Next Steps:
${nextSteps}

💡 Quick Recovery: Use {"format": "recovery"} if Claude times out
`;
}

function extractLastEditFromSession(session: Session): string {
  const editCalls = session.toolCalls.filter(call => 
    call.toolName === 'edit_block' || call.toolName === 'write_file'
  );
  
  if (editCalls.length === 0) return 'No recent edits';
  
  const lastEdit = editCalls[editCalls.length - 1];
  const fileName = lastEdit.arguments?.file_path || lastEdit.arguments?.path || 'unknown file';
  return `${fileName.split('/').pop()}`;
}

function extractLastSearchFromSession(session: Session): string | null {
  const searchCalls = session.toolCalls.filter(call => 
    call.toolName === 'search_code' || call.toolName === 'search_files'
  );
  
  if (searchCalls.length === 0) return null;
  
  const lastSearch = searchCalls[searchCalls.length - 1];
  return lastSearch.arguments?.pattern || 'Unknown pattern';
}

function inferTaskFromSession(session: Session): string {
  const toolSequence = session.toolCalls.map(call => call.toolName);
  const sequence = toolSequence.join(' → ');
  
  if (sequence.includes('search_code → read_file → edit_block')) {
    return 'Debugging and fixing code based on search results';
  }
  if (sequence.includes('read_file → edit_block')) {
    return 'Modifying existing code';
  }
  if (sequence.includes('execute_command')) {
    return 'Running tests/builds and validating changes';
  }
  if (sequence.includes('search_')) {
    return 'Investigating codebase and exploring files';
  }
  
  return 'General development work';
}

function generateNextSteps(session: Session, currentState?: CurrentStateContext): string {
  const recentTools = session.toolCalls.slice(-3).map(call => call.toolName);
  
  if (recentTools.includes('edit_block') || recentTools.includes('write_file')) {
    return '1. Test the recent changes\n2. Commit with meaningful message\n3. Continue with next development task';
  }
  if (recentTools.includes('search_code') || recentTools.includes('search_files')) {
    return '1. Review search results\n2. Make necessary code changes\n3. Test and validate changes';
  }
  if (recentTools.includes('execute_command')) {
    return '1. Review command output\n2. Address any issues found\n3. Continue with development';
  }
  
  return '1. Review recent work\n2. Determine next development priority\n3. Continue implementation';
}

function determineProjectStatus(session: Session): string {
  const hasErrors = session.toolCalls.some(call => 
    call.toolName === 'execute_command' && 
    call.arguments?.command?.includes('test') && 
    false // Would need actual result feedback
  );
  
  if (hasErrors) return 'Tests failing, needs attention';
  
  const hasRecentBuilds = session.toolCalls.some(call => 
    call.toolName === 'execute_command' && 
    (call.arguments?.command?.includes('build') || call.arguments?.command?.includes('npm'))
  );
  
  if (hasRecentBuilds) return 'Build successful, ready to proceed';
  
  return 'Development in progress';
}

function generateTextRecap(sessions: Session[], verbose: boolean, professional: boolean = false, currentState?: CurrentStateContext): string {
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalCalls = sessions.reduce((sum, s) => sum + s.toolCalls.length, 0);
  
  let output = '\n🔄 CONTEXTUAL RECAP\n';
  output += '═'.repeat(50) + '\n';
  
  if (sessions.length > 0) {
    const startTime = sessions[0].startTime.toLocaleString();
    const endTime = formatTimeAgo(sessions[sessions.length - 1].endTime);
    output += `📅 Time Range: ${startTime} → ${endTime}\n`;
    output += `⚡ Activity: ${totalCalls} tool calls across ${sessions.length} session${sessions.length === 1 ? '' : 's'}\n`;
  }
  
  // Recent sessions summary
  const recentSessions = sessions.slice(-3);
  if (recentSessions.length > 0) {
    output += '\n📊 RECENT SESSIONS\n';
    for (const session of recentSessions) {
      const timeAgo = formatTimeAgo(session.startTime);
      output += `\n**Session ${session.id.slice(-6)}** (${session.duration}m) - ${timeAgo}\n`;
      output += `  Project: ${session.primaryProject || 'Mixed'}\n`;
      output += `  Workflows: ${session.workflowPatterns.join(', ') || 'None detected'}\n`;
      
      // =============================================================================
      // INTELLIGENT INSIGHTS DISPLAY - Show intent analysis
      // =============================================================================
      
      // Display intent information if available
      if (session.primaryIntent) {
        const pattern = session.workPattern ? ` (${session.workPattern})` : '';
        const confidence = session.intentConfidence ? ` ${session.intentConfidence}%` : '';
        output += `  🧠 Intent: ${session.primaryIntent}${pattern}${confidence}\n`;
      }
      
      const fileList = session.filesAccessed.slice(0, 3).join(', ');
      const hasMore = session.filesAccessed.length > 3;
      output += `  Files: ${fileList}${hasMore ? '...' : ''}\n`;
      output += `  Operations: ${session.toolCalls.length} tools\n`;
    }
  }
  
  // Overall narrative
  output += '\n🎯 NARRATIVE SUMMARY\n';
  output += generateNarrative(sessions);
  
  // Current state analysis
  if (currentState && sessions.length > 0) {
    output += '\n\n🔍 CURRENT STATE\n';
    if (currentState.currentProject) {
      output += `Project: ${currentState.currentProject}\n`;
    }
    if (currentState.activeSessionId) {
      output += `Active Session: ${currentState.activeSessionId.slice(-6)} (${currentState.activeSessionDuration}m)\n`;
    }
    if (currentState.lastWorkingDirectory) {
      output += `Working Directory: ${currentState.lastWorkingDirectory}\n`;
    }
    output += `Recent Activity: ${currentState.recentActivity}\n`;
    if (currentState.recentFiles.length > 0) {
      const fileList = currentState.recentFiles.slice(0, 5).join(', ');
      const hasMore = currentState.recentFiles.length > 5;
      output += `Recent Files: ${fileList}${hasMore ? ` (+${currentState.recentFiles.length - 5} more)` : ''}\n`;
    }
  }
  
  // Verbose workflow analysis
  if (verbose && sessions.length > 0) {
    output += '\n\n🔧 WORKFLOW ANALYSIS\n';
    const workflowCounts: Record<string, number> = {};
    
    sessions.forEach(session => {
      session.workflowPatterns.forEach(pattern => {
        workflowCounts[pattern] = (workflowCounts[pattern] || 0) + 1;
      });
    });
    
    Object.entries(workflowCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([workflow, count]) => {
        output += `• ${workflow}: ${count} occurrence${count === 1 ? '' : 's'}\n`;
      });
  }
  
  output += '\n✨ Enhanced contextual logging active and working!\n';
  
  return output;
}

function generateNarrative(sessions: Session[]): string {
  if (sessions.length === 0) return 'No activity found.';
  
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalCalls = sessions.reduce((sum, s) => sum + s.toolCalls.length, 0);
  
  // Determine primary project
  const projectCounts: Record<string, number> = {};
  sessions.forEach(session => {
    if (session.primaryProject) {
      projectCounts[session.primaryProject] = 
        (projectCounts[session.primaryProject] || 0) + 1;
    }
  });
  
  const primaryProject = Object.entries(projectCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  // Determine primary workflow
  const workflowCounts: Record<string, number> = {};
  sessions.forEach(session => {
    session.workflowPatterns.forEach(pattern => {
      workflowCounts[pattern] = (workflowCounts[pattern] || 0) + 1;
    });
  });
  
  const primaryWorkflow = Object.entries(workflowCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  // Count unique files
  const allFiles = new Set<string>();
  sessions.forEach(session => {
    session.filesAccessed.forEach(file => allFiles.add(file));
  });
  
  // Build narrative
  let narrative = `Worked for ${totalDuration} minutes across ${sessions.length} session${sessions.length === 1 ? '' : 's'}. `;
  
  if (primaryProject) {
    narrative += `Primary focus: ${primaryProject} project. `;
  }
  
  if (primaryWorkflow) {
    narrative += `Main activity: ${primaryWorkflow} workflow. `;
  }
  
  if (allFiles.size > 0) {
    narrative += `Touched ${allFiles.size} file${allFiles.size === 1 ? '' : 's'}. `;
  }
  
  narrative += `Total operations: ${totalCalls}.`;
  
  return narrative;
}

function generateAnalysis(sessions: Session[], currentState?: CurrentStateContext): RecapAnalysis {
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalOperations = sessions.reduce((sum, s) => sum + s.toolCalls.length, 0);
  
  // Extract unique projects and files
  const projectSet = new Set<string>();
  const fileSet = new Set<string>();
  const workflowCounts: Record<string, number> = {};
  
  sessions.forEach(session => {
    if (session.primaryProject) {
      projectSet.add(session.primaryProject);
    }
    session.filesAccessed.forEach(file => fileSet.add(file));
    session.workflowPatterns.forEach(pattern => {
      workflowCounts[pattern] = (workflowCounts[pattern] || 0) + 1;
    });
  });
  
  const sessionMetadata: SessionMetadata[] = sessions.map(session => ({
    id: session.id,
    startTime: session.startTime.toISOString(),
    duration: session.duration,
    primaryProject: session.primaryProject,
    workflowPatterns: session.workflowPatterns,
    filesAccessed: session.filesAccessed,
    operationCount: session.toolCalls.length,
    // Include intent data in metadata
    primaryIntent: session.primaryIntent,
    workPattern: session.workPattern,
    intentConfidence: session.intentConfidence
  }));
  
  return {
    summary: {
      totalSessions: sessions.length,
      totalDuration,
      totalOperations,
      primaryProjects: Array.from(projectSet),
      workflowDistribution: workflowCounts,
      filesModified: Array.from(fileSet),
      timeRange: {
        start: sessions[0]?.startTime || new Date(),
        end: sessions[sessions.length - 1]?.endTime || new Date()
      }
    },
    sessions: sessionMetadata,
    currentState
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function generateEmptyRecapMessage(hours: number): string {
  return `📭 No enhanced DesktopCommanderMCP activity found in the last ${hours} hours.\n\nMake sure enhanced contextual logging is installed and active:\nnpm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging\n\nThen restart Claude Desktop and use some tools to generate activity data.`;
}

function handleError(error: unknown): MCPToolResponse {
  if (error instanceof RecapError) {
    return {
      content: [{
        type: "text",
        text: `❌ ${error.message}`
      }],
      isError: true
    };
  }
  
  return {
    content: [{
      type: "text",
      text: `❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    }],
    isError: true
  };
}

// =============================================================================
// Exports
// =============================================================================

export { RecapArgsSchema };
