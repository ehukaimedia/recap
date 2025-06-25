# TrackTools.ts Enhancement Analysis for Recovery Mode

## Current Data Captured

### 1. Tool Call Information
- **Tool Name**: The exact tool being called (e.g., `read_file`, `edit_block`)
- **Arguments**: Full arguments passed to each tool
- **Timestamp**: Exact time of each tool call
- **Session ID**: Unique identifier for work sessions
- **Session Age**: How long the session has been active

### 2. Context Information
- **Project Name**: Extracted from working directory
- **Workflow Patterns**: EDITING, EXPLORATION, DEBUGGING, SETUP, ANALYSIS, EXECUTION
- **File Paths**: All files accessed, modified, or created
- **Tool Sequences**: Last 5 tools in order (e.g., `search_code→read_file→edit_block`)
- **Working Directory**: Current directory context

### 3. Intent Detection (Already Excellent!)
- **Intent**: Human-readable goal (e.g., "Debug and fix identified error")
- **Confidence**: 25-90% confidence scoring
- **Work Pattern**: reactive, proactive, investigative, maintenance
- **Evidence**: Array of reasons for intent detection

## Data Available But Not Captured

### 1. Command Execution Results
Currently, trackToolCall is called BEFORE command execution completes. We're missing:
- **Exit codes**: Success/failure of commands
- **Error outputs**: Actual error messages from failed commands
- **Command duration**: How long commands took to execute
- **Output size**: Amount of output generated

### 2. Edit Operation Details
From `edit_block` we could extract:
- **Edit size**: Length of old_string vs new_string
- **Edit type**: Addition, deletion, modification
- **Code patterns**: What kind of code is being edited (functions, imports, etc.)
- **Line numbers**: Approximate location in file

### 3. Search Results Context
- **Match count**: How many results were found
- **Result actions**: Whether search results were acted upon
- **Search refinements**: How searches evolve over time

### 4. File Operation Metadata
- **File sizes**: Size of files being read/written
- **File types**: Extensions and inferred content types
- **Creation vs modification**: Whether files are new or existing

### 5. Session Recovery Metadata
- **Incomplete operations**: Operations started but not verified
- **Operation chains**: Related operations that form a complete task
- **Checkpoint triggers**: When to save state for recovery

## Proposed Enhancements to trackTools.ts

### 1. Enhanced Edit Tracking
```typescript
interface EnhancedEditContext extends EditContext {
  editSize: number;
  editRatio: number; // new_size / old_size
  codePattern?: 'function' | 'import' | 'interface' | 'class' | 'variable';
  estimatedLineNumber?: number;
  isCreation: boolean;
  isDeletion: boolean;
}
```

### 2. Command Result Tracking
Add a new function to be called AFTER command execution:
```typescript
export async function trackCommandResult(
  toolName: string, 
  args: any, 
  result: {
    success: boolean;
    exitCode?: number;
    duration: number;
    outputSize: number;
    errorSnippet?: string;
  }
): Promise<void>
```

### 3. Recovery Checkpoint System
```typescript
interface RecoveryCheckpoint {
  triggerType: 'time' | 'operation_count' | 'critical_operation';
  incompleteTasks: Array<{
    operation: string;
    target: string;
    needsVerification: boolean;
  }>;
  lastStableState: Date;
}
```

### 4. Enhanced Search Tracking
```typescript
interface EnhancedSearchOperation extends SearchOperation {
  resultCount: number;
  wasActedUpon: boolean;
  followupTools: string[];
  searchEvolution?: string[]; // track how searches change
}
```

### 5. Operation Chain Detection
```typescript
interface OperationChain {
  id: string;
  startTool: string;
  expectedSequence: string[];
  actualSequence: string[];
  isComplete: boolean;
  missingSteps: string[];
}
```

## Implementation Strategy (Only Modifying trackTools.ts)

### Phase 1: Enhance Current Data Extraction
1. Extract more metadata from existing arguments
2. Improve edit context detection
3. Add file metadata tracking
4. Enhance search operation tracking

### Phase 2: Add Recovery-Specific Features
1. Detect incomplete operation chains
2. Identify operations needing verification
3. Track operation dependencies
4. Auto-checkpoint on critical operations

### Phase 3: Add Result Correlation
1. Create a pending operations map
2. Match results to original calls
3. Track success/failure patterns
4. Build operation outcome history

## Key Benefits for Recovery Mode

1. **Better Incomplete Task Detection**
   - Know which edits weren't tested
   - Identify searches without follow-up
   - Track commands without result verification

2. **Richer Context for Recovery**
   - Understand why operations failed
   - Know exact state at interruption
   - Provide more specific recovery steps

3. **Smarter Recovery Suggestions**
   - Based on operation chains
   - Considering past success/failure
   - Understanding task dependencies

4. **Enhanced Session Continuity**
   - Checkpoint at critical moments
   - Track operation relationships
   - Maintain task context across sessions

## Example Enhanced Log Entry

```json
{
  "timestamp": "2024-12-27T10:30:00Z",
  "tool": "edit_block",
  "context": {
    "session": "abc123",
    "intent": "Fix authentication bug",
    "intentConfidence": 85,
    "workPattern": "reactive",
    "operationChain": {
      "id": "auth-fix-001",
      "sequence": ["search_code", "read_file", "edit_block"],
      "isComplete": false,
      "missingSteps": ["execute_command:test"]
    }
  },
  "args": {
    "file_path": "/src/auth.js",
    "old_string": "...",
    "new_string": "..."
  },
  "metadata": {
    "editSize": 150,
    "editRatio": 1.2,
    "codePattern": "function",
    "estimatedLine": 45,
    "fileSize": 2048,
    "needsVerification": true
  }
}
```

## Next Steps

1. Implement enhanced metadata extraction from existing args
2. Add operation chain detection logic
3. Create recovery checkpoint triggers
4. Build incomplete task detection system
5. Enhance intent detection with operation outcomes

All improvements stay within trackTools.ts, maintaining the constraint while significantly improving recovery capabilities.
