# Implementation Guide: Enhancing trackTools.ts for Recovery Mode

## Overview
This guide shows exactly where and how to add recovery-focused enhancements to the existing trackTools.ts file. All changes are additive and backward-compatible.

## Step-by-Step Implementation

### 1. Add New Interfaces (After line 95, before ContextState)

```typescript
/**
 * Enhanced edit context for better recovery information
 */
interface EnhancedEditContext extends EditContext {
  editSize: number;
  editRatio: number;
  codePattern?: 'function' | 'import' | 'interface' | 'class' | 'variable' | 'config';
  isCreation: boolean;
  isDeletion: boolean;
  fileExtension?: string;
}

/**
 * Operation chain tracking for incomplete task detection  
 */
interface OperationChain {
  id: string;
  startTime: Date;
  startTool: string;
  tools: string[];
  files: Set<string>;
  isComplete: boolean;
  needsVerification: string[];
}
```

### 2. Enhance ContextState (Modify existing interface around line 100)

```typescript
interface ContextState {
  // ... existing fields ...
  
  // Add these new fields:
  operationChains: Map<string, OperationChain>;
  pendingVerifications: Array<{
    tool: string;
    target: string; 
    timestamp: Date;
    reason: string;
  }>;
  lastCheckpoint?: Date;
  fileMetadata: Map<string, {
    extension: string;
    accessCount: number;
    lastModified?: Date;
  }>;
  searchEvolution: Map<string, string[]>;
}
```

### 3. Update contextState Initialization (Around line 120)

```typescript
let contextState: ContextState = {
  recentFiles: [],
  toolSequence: [],
  recentSearches: [],
  searchContext: new Map(),
  recentArgs: [],
  intentSignals: [],
  workPattern: 'proactive',
  // Add new fields:
  operationChains: new Map(),
  pendingVerifications: [],
  fileMetadata: new Map(),
  searchEvolution: new Map()
};
```

### 4. Add Helper Functions (After existing helper functions, around line 500)

```typescript
/**
 * Track operation chains for recovery
 */
function updateOperationChains(toolName: string, args: any): void {
  const chains = contextState.operationChains;
  
  // Start new chain on search operations
  if (toolName === 'search_code' || toolName === 'search_files') {
    const chainId = `chain_${Date.now()}`;
    chains.set(chainId, {
      id: chainId,
      startTime: new Date(),
      startTool: toolName,
      tools: [toolName],
      files: new Set(extractFilePaths(args)),
      isComplete: false,
      needsVerification: []
    });
  } else {
    // Update existing chains
    for (const [id, chain] of chains) {
      if (Date.now() - chain.startTime.getTime() < 10 * 60 * 1000) {
        chain.tools.push(toolName);
        extractFilePaths(args).forEach(f => chain.files.add(f));
        
        if (toolName === 'edit_block' || toolName === 'write_file') {
          chain.needsVerification.push('test_execution');
        }
        
        if (toolName === 'execute_command' && args?.command?.includes('test')) {
          chain.isComplete = true;
        }
      }
    }
  }
  
  // Clean old chains
  for (const [id, chain] of chains) {
    if (Date.now() - chain.startTime.getTime() > 30 * 60 * 1000) {
      chains.delete(id);
    }
  }
}

/**
 * Track pending verifications
 */
function trackPendingVerification(toolName: string, args: any): void {
  if (toolName === 'edit_block' || toolName === 'write_file') {
    const target = args.file_path || args.path || 'unknown';
    contextState.pendingVerifications.push({
      tool: toolName,
      target,
      timestamp: new Date(),
      reason: 'File modified without test verification'
    });
  }
  
  if (toolName === 'execute_command' && args?.command?.includes('test')) {
    contextState.pendingVerifications = contextState.pendingVerifications.filter(v => 
      Date.now() - v.timestamp.getTime() > 5 * 60 * 1000
    );
  }
}

/**
 * Track search evolution
 */
function trackSearchEvolution(pattern: string): void {
  const normalized = pattern.toLowerCase().trim();
  
  for (const [existing, evolution] of contextState.searchEvolution) {
    if (existing.includes(normalized) || normalized.includes(existing)) {
      evolution.push(pattern);
      return;
    }
  }
  
  contextState.searchEvolution.set(normalized, [pattern]);
}
```

### 5. Enhance Main trackToolCall Function

#### Add after recent args tracking (around line 900):

```typescript
// Track recent arguments (existing code)
if (args) {
  contextState.recentArgs.push(args);
  if (contextState.recentArgs.length > MAX_RECENT_ARGS) {
    contextState.recentArgs.shift();
  }
}

// ADD NEW TRACKING HERE:
// Enhanced tracking for recovery mode
updateOperationChains(toolName, args);
trackPendingVerification(toolName, args);

// Track search evolution
if ((toolName === 'search_code' || toolName === 'search_files') && args?.pattern) {
  trackSearchEvolution(args.pattern);
}

// Update file metadata
for (const filePath of extractFilePaths(args)) {
  const metadata = contextState.fileMetadata.get(filePath) || {
    extension: path.extname(filePath),
    accessCount: 0
  };
  metadata.accessCount++;
  metadata.lastModified = new Date();
  contextState.fileMetadata.set(filePath, metadata);
}
```

#### Enhance context info building (around line 950):

```typescript
// After existing context info setup, add:

// Add recovery-focused information
const activeChains = Array.from(contextState.operationChains.values())
  .filter(c => !c.isComplete && Date.now() - c.startTime.getTime() < 10 * 60 * 1000);

if (activeChains.length > 0) {
  contextInfo.activeOperationChains = activeChains.map(c => ({
    id: c.id,
    pattern: c.tools.join('→'),
    needsVerification: c.needsVerification.filter((v, i, a) => a.indexOf(v) === i),
    fileCount: c.files.size
  }));
}

// Add pending verifications
const recentVerifications = contextState.pendingVerifications
  .filter(v => Date.now() - v.timestamp.getTime() < 10 * 60 * 1000)
  .slice(-3);

if (recentVerifications.length > 0) {
  contextInfo.pendingVerifications = recentVerifications.map(v => ({
    tool: v.tool,
    target: path.basename(v.target),
    age: `${Math.round((Date.now() - v.timestamp.getTime()) / 1000 / 60)}m`
  }));
}

// Add enhanced edit metadata
if ((toolName === 'edit_block' || toolName === 'write_file') && args) {
  const oldSize = args.old_string?.length || 0;
  const newSize = args.new_string?.length || args.content?.length || 0;
  
  contextInfo.editMetadata = {
    changeSize: Math.abs(newSize - oldSize),
    changeRatio: oldSize > 0 ? (newSize / oldSize).toFixed(2) : 'new',
    operation: oldSize === 0 ? 'create' : newSize === 0 ? 'delete' : 'modify'
  };
}

// Add file activity summary
if (contextState.recentFiles.length > 0) {
  const topFiles = Array.from(contextState.fileMetadata.entries())
    .sort((a, b) => b[1].accessCount - a[1].accessCount)
    .slice(0, 3)
    .map(([file, meta]) => ({
      name: path.basename(file),
      accesses: meta.accessCount
    }));
  
  if (topFiles.length > 0) {
    contextInfo.hotFiles = topFiles;
  }
}
```

## Example Enhanced Log Output

```json
{
  "timestamp": "2025-01-25T10:30:00Z",
  "toolName": "edit_block",
  "contextInfo": {
    "session": "abc123_def456",
    "sessionAge": "15m",
    "project": "RecapMCP",
    "workflow": "EDITING",
    "intent": "Fix authentication bug",
    "intentConfidence": 85,
    "workPattern": "reactive",
    "activeOperationChains": [{
      "id": "chain_1234567890",
      "pattern": "search_code→read_file→edit_block",
      "needsVerification": ["test_execution"],
      "fileCount": 3
    }],
    "pendingVerifications": [{
      "tool": "edit_block",
      "target": "auth.js",
      "age": "2m"
    }],
    "editMetadata": {
      "changeSize": 150,
      "changeRatio": "1.20",
      "operation": "modify"
    },
    "hotFiles": [
      {"name": "auth.js", "accesses": 5},
      {"name": "test.js", "accesses": 3}
    ]
  },
  "args": {
    "file_path": "/src/auth.js",
    "old_string": "...",
    "new_string": "..."
  }
}
```

## Benefits for Recovery Mode

1. **Operation Chain Tracking**: Identifies incomplete workflows
2. **Pending Verifications**: Shows what needs testing/validation
3. **File Activity Metrics**: Identifies focus areas
4. **Edit Metadata**: Understands scope of changes
5. **Search Evolution**: Shows how investigation progressed

## Testing the Enhancement

1. Make a small edit to trigger tracking
2. Check the log file for enhanced data
3. Run recovery mode to see improved suggestions
4. Verify backward compatibility

All enhancements maintain backward compatibility while significantly improving recovery capabilities!
