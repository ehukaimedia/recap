/**
 * TypeScript type definitions for RecapMCP
 * Professional type safety for MCP server implementation
 */

import { z } from 'zod';

// =============================================================================
// MCP Tool Schemas
// =============================================================================

export const RecapArgsSchema = z.object({
  hours: z.number().min(1).max(168).default(24).describe("Hours of activity to analyze (1-168, default: 24)")
});

export type RecapArgs = z.infer<typeof RecapArgsSchema>;

export const RunArgsSchema = z.object({
  command: z.string().optional().describe("Command to run (e.g., build, test, dev, or custom command)"),
  projectPath: z.string().optional().describe("Project directory (defaults to current directory)"),
  args: z.array(z.string()).default([]).describe("Additional arguments to pass"),
  env: z.record(z.string()).default({}).describe("Environment variables to set"),
  timeout: z.number().default(30000).describe("Execution timeout in milliseconds")
});

export type RunArgs = z.infer<typeof RunArgsSchema>;

// =============================================================================
// Intent Detection Types
// =============================================================================

export interface IntentSignals {
  trigger: 'error_response' | 'exploration' | 'planned_work' | 'maintenance';
  confidence: number; // 0-1 confidence score
  evidence: string[]; // What led to this conclusion
  likely_goal: string; // Inferred purpose
  category: 'reactive' | 'proactive' | 'investigative' | 'maintenance';
}

export enum IntentCategory {
  ERROR_DRIVEN = 'error_driven',
  PLANNED_DEVELOPMENT = 'planned_development', 
  EXPLORATORY = 'exploratory',
  MAINTENANCE = 'maintenance'
}

// =============================================================================
// Universal Run Tool Types
// =============================================================================

export interface ProjectContext {
  root: string;
  type: ProjectType[];
  packageManagers: PackageManager[];
  frameworks?: Framework[];
  virtualEnv?: string;
  metadata?: {
    packageJson?: any;
    requirementsTxt?: string[];
    pyprojectToml?: any;
    pipfile?: any;
  };
}

export type ProjectType = 'node' | 'python' | 'polyglot' | 'unknown';
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'pipenv';
export type Framework = 'django' | 'flask' | 'fastapi' | 'next' | 'react' | 'vue' | 'express';

export interface Command {
  name: string;
  displayName: string;
  description: string;
  category: CommandCategory;
  executable: string;
  args: string[];
  env?: Record<string, string>;
  workingDir?: string;
}

export type CommandCategory = 'dev' | 'build' | 'test' | 'deploy' | 'utils' | 'custom';

export interface RunnerModule {
  name: string;
  detectProject(root: string): Promise<boolean>;
  discoverCommands(context: ProjectContext): Promise<Command[]>;
  formatCommand(executable: string, args: string[], platform: NodeJS.Platform): FormattedCommand;
  normalizePath(filePath: string, platform: NodeJS.Platform): string;
}

export interface FormattedCommand {
  shell: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ExecutionResult {
  success: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  duration: number;
  timedOut: boolean;
}

// =============================================================================
// Core Data Types  
// =============================================================================

export interface ContextInfo {
  session: string;
  sessionAge: string;
  newSession?: boolean;
  project?: string;
  workflow?: string;
  sequence?: string;
  files?: string[];
  // Intent detection fields
  intent?: string;
  intentConfidence?: number;
  workPattern?: 'reactive' | 'proactive' | 'investigative' | 'maintenance';
  intentEvidence?: string[];
}

export interface EnhancedToolCall {
  timestamp: Date;
  toolName: string;
  contextInfo?: ContextInfo;
  arguments?: Record<string, any>;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  primaryProject?: string;
  workflowPatterns: string[];
  filesAccessed: string[];
  toolCalls: EnhancedToolCall[];
  // Intent detection fields
  primaryIntent?: string;
  workPattern?: 'reactive' | 'proactive' | 'investigative' | 'maintenance';
  intentConfidence?: number;
}

export interface SessionSummary {
  totalSessions: number;
  totalDuration: number; // minutes
  totalOperations: number;
  primaryProjects: string[];
  workflowDistribution: Record<string, number>;
  filesModified: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface ProductivityMetrics {
  averageSessionLength: number; // minutes
  toolsPerMinute: number;
  mostActiveHour: number; // 0-23
  sessionFrequency: number; // sessions per day
}

export interface CurrentStateContext {
  lastWorkingDirectory?: string;
  currentProject?: string;
  recentFiles: string[]; // Last 10 minutes
  activeSessionId?: string;
  activeSessionDuration: number; // minutes
  recentActivity: string; // Last 5 minutes summary
  availableStructure: string[]; // Current directory contents
}

// =============================================================================
// Analysis Results
// =============================================================================

export interface RecapAnalysis {
  summary: SessionSummary;
  sessions: SessionMetadata[];
  metrics?: ProductivityMetrics;
  currentState?: CurrentStateContext;
}

export interface SessionMetadata {
  id: string;
  startTime: string; // ISO string
  duration: number;
  primaryProject?: string;
  workflowPatterns: string[];
  filesAccessed: string[];
  operationCount: number;
  // Intent detection fields
  primaryIntent?: string;
  workPattern?: 'reactive' | 'proactive' | 'investigative' | 'maintenance';
  intentConfidence?: number;
}

export interface EditContext {
  file: string;
  lineNumber?: number;
  functionName?: string;
  editType: 'create' | 'modify' | 'delete';
  purpose: string;
}

export interface WorkHandoff {
  location: string;
  activeEdit?: EditContext;
  currentTask: string;
  lastSearch?: string;
  status: string;
  nextAction: string;
}

// =============================================================================
// Configuration & Constants
// =============================================================================

export interface RecapConfig {
  logPaths: string[];
  maxSessions: number;
  sessionTimeoutMs: number;
  maxRecentFiles: number;
  maxToolSequence: number;
}

export const DEFAULT_CONFIG: RecapConfig = {
  logPaths: [
    '~/.claude-server-commander/claude_tool_call.log',
    '/.claude-server-commander/claude_tool_call.log'
  ],
  maxSessions: 50,
  sessionTimeoutMs: 15 * 60 * 1000, // 15 minutes
  maxRecentFiles: 10,
  maxToolSequence: 5
};

// =============================================================================
// Workflow Patterns
// =============================================================================

export enum WorkflowPattern {
  EXPLORATION = 'EXPLORATION',
  EDITING = 'EDITING', 
  DEBUGGING = 'DEBUGGING',
  SETUP = 'SETUP',
  ANALYSIS = 'ANALYSIS',
  EXECUTION = 'EXECUTION'
}

export const WORKFLOW_PATTERNS: Record<string, WorkflowPattern> = {
  'list_directory → read_file': WorkflowPattern.EXPLORATION,
  'read_file → edit_block': WorkflowPattern.EDITING,
  'search_code → read_file': WorkflowPattern.DEBUGGING,
  'create_directory → write_file': WorkflowPattern.SETUP,
  'read_multiple_files': WorkflowPattern.ANALYSIS,
  'execute_command': WorkflowPattern.EXECUTION
};

// =============================================================================
// MCP Response Types
// =============================================================================

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface MCPToolListResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: object;
  }>;
}

// =============================================================================
// Error Types
// =============================================================================

export class RecapError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RecapError';
  }
}

export class LogParseError extends RecapError {
  constructor(message: string, public lineNumber?: number) {
    super(message, 'LOG_PARSE_ERROR', { lineNumber });
    this.name = 'LogParseError';
  }
}

export class ConfigError extends RecapError {
  constructor(message: string, public configPath?: string) {
    super(message, 'CONFIG_ERROR', { configPath });
    this.name = 'ConfigError';
  }
}

// =============================================================================
// Utility Types
// =============================================================================

export type TimeRange = {
  start: Date;
  end: Date;
};

export type FileMetadata = {
  path: string;
  basename: string;
  accessCount: number;
  lastAccessed: Date;
};

export type ProjectMetadata = {
  name: string;
  path: string;
  sessionCount: number;
  totalDuration: number;
  primaryWorkflows: WorkflowPattern[];
};

// =============================================================================
// Recovery Types
// =============================================================================

export interface InterruptedOperation {
  type: 'unsaved_edit' | 'pending_search' | 'incomplete_command' | 'unresolved_error';
  file?: string;
  pattern?: string;
  command?: string;
  timestamp: Date;
  description: string;
}

export interface RecoveryContext {
  sessionId: string;
  lastActivityTime: Date;
  lastToolUsed: string;
  lastFile: string | null;
  workingDirectory: string | null;
  pendingOperations: InterruptedOperation[];
  uncommittedChanges: string[];
  lastError: string | null;
  suggestedActions: string[];
  // Enhanced tracking data from trackTools.ts
  operationChains?: Array<{
    id: string;
    purpose: string;
    progress: string;
    toolSequence: string;
    pendingSteps: string[];
  }>;
  fileHeatmap?: Array<{
    file: string;
    accesses: number;
    category: string;
    operations: string;
  }>;
  searchEvolution?: {
    patterns: string[];
    refinements?: string[];
  };
  pendingTests?: string[];
}

export interface StateCheckpoint {
  timestamp: string;
  sessionId: string;
  project?: string;
  workflowPatterns: string[];
  filesAccessed: string[];
  lastTools: Array<{
    tool: string;
    timestamp: Date;
    args?: Record<string, any>;
  }>;
  intent?: string;
  intentConfidence?: number;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isEnhancedToolCall(obj: any): obj is EnhancedToolCall {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.timestamp instanceof Date &&
    typeof obj.toolName === 'string' &&
    (obj.contextInfo === undefined || (
      typeof obj.contextInfo === 'object' &&
      typeof obj.contextInfo.session === 'string'
    ))
  );
}

export function isValidSession(obj: any): obj is Session {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    obj.startTime instanceof Date &&
    obj.endTime instanceof Date &&
    typeof obj.duration === 'number' &&
    Array.isArray(obj.workflowPatterns) &&
    Array.isArray(obj.filesAccessed) &&
    Array.isArray(obj.toolCalls)
  );
}

export function hasValidContextInfo(call: EnhancedToolCall): call is EnhancedToolCall & { contextInfo: ContextInfo } {
  return !!(call.contextInfo && call.contextInfo.session);
}
