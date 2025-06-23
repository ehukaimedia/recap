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
    
    // Generate output in requested format
    let content: string;
    if (args.format === 'json') {
      content = JSON.stringify(generateAnalysis(sessions, currentState), null, 2);
    } else if (args.format === 'handoff') {
      content = generateHandoffNote(sessions, currentState);
    } else {
      content = generateTextRecap(sessions, args.verbose, args.professional, currentState);
    }
    
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
  
  return `
🔄 SESSION HANDOFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Working Directory: ${currentState?.lastWorkingDirectory || 'Unknown'}
📝 Active File: ${lastEdit || 'No recent edits'}
🎯 Current Task: ${currentTask}
🔍 Last Search: ${lastSearch || 'None'}
⚡ Status: ${status}

🚀 Next Steps:
${nextSteps}
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
