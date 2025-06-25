/**
 * Example Implementation: Enhanced trackTools.ts Modifications
 * 
 * This shows the EXACT changes needed to trackTools.ts to produce
 * the enhanced recovery output shown in recovery-example-comparison.md
 */

// ============================================================================
// SECTION 1: Add these interfaces after existing interfaces (line ~95)
// ============================================================================

interface EnhancedEditContext extends EditContext {
  editSize: number;
  editRatio: number;
  codePattern?: 'function' | 'import' | 'interface' | 'class' | 'variable' | 'validation';
  beforeSnippet?: string;  // First 100 chars of old_string
  afterSnippet?: string;   // First 100 chars of new_string
  isDefensiveCode: boolean; // Detects null checks, try-catch, etc.
}

interface OperationChain {
  id: string;
  sessionId: string;
  intentCategory: string; // From intent detection
  startTime: Date;
  lastUpdateTime: Date;
  description: string; // Human readable purpose
  tools: Array<{
    name: string;
    timestamp: Date;
    status: 'complete' | 'pending';
    target?: string;
  }>;
  requiredVerifications: string[];
  completionPercentage: number;
}

interface SearchEvolution {
  id: string;
  patterns: Array<{
    query: string;
    timestamp: Date;
    resultCount?: number;
    refinementReason?: string;
  }>;
  conclusion?: string; // What was found
}

interface FileActivityMetrics {
  path: string;
  accessCount: number;
  readCount: number;
  writeCount: number;
  lastAccessed: Date;
  category: 'focus' | 'reference' | 'config' | 'test';
  relatedFiles: string[]; // Files accessed in same chain
}

// ============================================================================
// SECTION 2: Enhance ContextState interface (modify around line 100)
// ============================================================================

interface ContextState {
  // ... existing fields ...
  
  // Add these for enhanced recovery:
  operationChains: Map<string, OperationChain>;
  searchEvolutions: Map<string, SearchEvolution>;
  fileMetrics: Map<string, FileActivityMetrics>;
  codeChanges: Array<{
    file: string;
    timestamp: Date;
    before: string;
    after: string;
    pattern: string;
  }>;
  pendingTests: Set<string>; // Files that need testing
  lastError?: {
    search: string;
    file: string;
    pattern: string;
  };
}

// ============================================================================
// SECTION 3: Add helper functions for enhanced tracking (after line 500)
// ============================================================================

/**
 * Detect defensive coding patterns
 */
function isDefensiveCodePattern(oldStr: string, newStr: string): boolean {
  const defensivePatterns = [
    /if\s*\(\s*![^)]+\)/, // null checks
    /typeof\s+\w+\s*===/, // type checks
    /try\s*{/, // try-catch blocks
    /\.hasOwnProperty/, // property checks
    /\?\./,  // optional chaining
    /\?\?/   // nullish coalescing
  ];
  
  const addedCode = newStr.replace(oldStr, '');
  return defensivePatterns.some(pattern => pattern.test(addedCode));
}

/**
 * Extract code change context for recovery
 */
function extractCodeChangeContext(args: any): any {
  if (!args.old_string || !args.new_string) return null;
  
  const oldLines = args.old_string.split('\n');
  const newLines = args.new_string.split('\n');
  
  // Find what changed
  let changeType = 'modification';
  if (args.old_string.length === 0) changeType = 'creation';
  else if (args.new_string.length === 0) changeType = 'deletion';
  else if (newLines.length > oldLines.length) changeType = 'expansion';
  else if (newLines.length < oldLines.length) changeType = 'reduction';
  
  // Detect pattern
  const addedCode = args.new_string.replace(args.old_string, '');
  let pattern = 'general';
  if (addedCode.includes('if') && addedCode.includes('return')) pattern = 'validation';
  if (addedCode.includes('function')) pattern = 'function';
  if (addedCode.includes('class')) pattern = 'class';
  if (addedCode.includes('import')) pattern = 'import';
  
  return {
    changeType,
    pattern,
    linesAdded: newLines.length - oldLines.length,
    charactersAdded: args.new_string.length - args.old_string.length,
    isDefensive: isDefensiveCodePattern(args.old_string, args.new_string),
    snippet: {
      before: args.old_string.substring(0, 200),
      after: args.new_string.substring(0, 200)
    }
  };
}

/**
 * Update operation chains with rich context
 */
function updateOperationChains(toolName: string, args: any, intent: any): void {
  const chains = contextState.operationChains;
  
  // Check if this continues an existing chain
  let activeChain: OperationChain | undefined;
  for (const [id, chain] of chains) {
    const timeSinceUpdate = Date.now() - chain.lastUpdateTime.getTime();
    if (timeSinceUpdate < 10 * 60 * 1000) { // 10 minutes
      activeChain = chain;
      break;
    }
  }
  
  if (!activeChain) {
    // Start new chain
    const chainId = `${contextState.sessionId}-${Date.now().toString(36)}`;
    activeChain = {
      id: chainId,
      sessionId: contextState.sessionId!,
      intentCategory: intent?.category || 'unknown',
      startTime: new Date(),
      lastUpdateTime: new Date(),
      description: intent?.likely_goal || 'General development',
      tools: [],
      requiredVerifications: [],
      completionPercentage: 0
    };
    chains.set(chainId, activeChain);
  }
  
  // Add tool to chain
  const target = extractPrimaryTarget(toolName, args);
  activeChain.tools.push({
    name: toolName,
    timestamp: new Date(),
    status: 'complete',
    target
  });
  
  // Update verification requirements
  if (toolName === 'edit_block' || toolName === 'write_file') {
    activeChain.requiredVerifications.push(`test:${target}`);
    contextState.pendingTests.add(target);
  }
  
  // Clear verifications if tests run
  if (toolName === 'execute_command' && args?.command?.includes('test')) {
    activeChain.requiredVerifications = activeChain.requiredVerifications
      .filter(v => !v.includes('test'));
    contextState.pendingTests.clear();
  }
  
  // Calculate completion
  activeChain.lastUpdateTime = new Date();
  activeChain.completionPercentage = calculateChainCompletion(activeChain);
}

/**
 * Track search pattern evolution
 */
function trackSearchEvolution(pattern: string, toolName: string): void {
  let evolution: SearchEvolution | undefined;
  
  // Find related evolution
  for (const [id, evo] of contextState.searchEvolutions) {
    const lastPattern = evo.patterns[evo.patterns.length - 1];
    if (isRelatedSearch(lastPattern.query, pattern)) {
      evolution = evo;
      break;
    }
  }
  
  if (!evolution) {
    evolution = {
      id: `search-${Date.now().toString(36)}`,
      patterns: []
    };
    contextState.searchEvolutions.set(evolution.id, evolution);
  }
  
  // Determine refinement reason
  let refinementReason = '';
  if (evolution.patterns.length > 0) {
    const lastQuery = evolution.patterns[evolution.patterns.length - 1].query;
    if (pattern.length > lastQuery.length) {
      refinementReason = 'Narrowing search';
    } else if (pattern.includes(' ') && !lastQuery.includes(' ')) {
      refinementReason = 'Adding context';
    } else {
      refinementReason = 'Refining terms';
    }
  }
  
  evolution.patterns.push({
    query: pattern,
    timestamp: new Date(),
    refinementReason
  });
}

/**
 * Update file activity metrics
 */
function updateFileMetrics(filePath: string, toolName: string): void {
  let metrics = contextState.fileMetrics.get(filePath);
  
  if (!metrics) {
    metrics = {
      path: filePath,
      accessCount: 0,
      readCount: 0,
      writeCount: 0,
      lastAccessed: new Date(),
      category: categorizeFile(filePath),
      relatedFiles: []
    };
    contextState.fileMetrics.set(filePath, metrics);
  }
  
  metrics.accessCount++;
  metrics.lastAccessed = new Date();
  
  if (toolName === 'read_file' || toolName === 'read_multiple_files') {
    metrics.readCount++;
  } else if (toolName === 'write_file' || toolName === 'edit_block') {
    metrics.writeCount++;
  }
  
  // Track related files (files accessed in same session)
  for (const otherPath of contextState.recentFiles) {
    if (otherPath !== filePath && !metrics.relatedFiles.includes(otherPath)) {
      metrics.relatedFiles.push(otherPath);
    }
  }
}

/**
 * Helper to categorize files
 */
function categorizeFile(filePath: string): 'focus' | 'reference' | 'config' | 'test' {
  const basename = path.basename(filePath).toLowerCase();
  if (basename.includes('test') || basename.includes('spec')) return 'test';
  if (basename.includes('config') || basename.endsWith('.json')) return 'config';
  if (filePath.includes('node_modules') || filePath.includes('lib')) return 'reference';
  return 'focus';
}

// ============================================================================
// SECTION 4: Modify main trackToolCall function (around line 850)
// ============================================================================

export async function trackToolCall(toolName: string, args?: unknown): Promise<void> {
  try {
    // ... existing session management code ...
    
    // ENHANCED TRACKING ADDITIONS:
    
    // Track operation chains with intent context
    if (contextState.intentSignals.length > 0) {
      const latestIntent = contextState.intentSignals[contextState.intentSignals.length - 1];
      updateOperationChains(toolName, args, latestIntent);
    }
    
    // Track search evolution
    if ((toolName === 'search_code' || toolName === 'search_files') && args?.pattern) {
      trackSearchEvolution(args.pattern, toolName);
    }
    
    // Enhanced file metrics
    const filePaths = extractFilePaths(args);
    for (const filePath of filePaths) {
      updateFileMetrics(filePath, toolName);
    }
    
    // Track code changes for recovery
    if (toolName === 'edit_block' && args) {
      const changeContext = extractCodeChangeContext(args);
      if (changeContext) {
        contextState.codeChanges.push({
          file: args.file_path,
          timestamp: new Date(),
          before: args.old_string.substring(0, 200),
          after: args.new_string.substring(0, 200),
          pattern: changeContext.pattern
        });
        
        // Keep only last 10 changes
        if (contextState.codeChanges.length > 10) {
          contextState.codeChanges.shift();
        }
      }
    }
    
    // ... existing context info building ...
    
    // ADD TO CONTEXT INFO:
    
    // Add operation chain status
    const activeChains = Array.from(contextState.operationChains.values())
      .filter(c => Date.now() - c.lastUpdateTime.getTime() < 10 * 60 * 1000);
    
    if (activeChains.length > 0) {
      contextInfo.operationChains = activeChains.map(chain => ({
        id: chain.id,
        purpose: chain.description,
        progress: `${chain.completionPercentage}%`,
        toolSequence: chain.tools.map(t => t.name).join('→'),
        pendingSteps: chain.requiredVerifications
      }));
    }
    
    // Add search evolution
    const recentSearchEvolution = Array.from(contextState.searchEvolutions.values())
      .filter(e => e.patterns.length > 1)
      .slice(-1)[0];
      
    if (recentSearchEvolution) {
      contextInfo.searchEvolution = {
        patterns: recentSearchEvolution.patterns.map(p => p.query),
        conclusion: recentSearchEvolution.conclusion
      };
    }
    
    // Add file heatmap
    const fileHeatmap = Array.from(contextState.fileMetrics.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 5)
      .map(([path, metrics]) => ({
        file: path.basename(path),
        accesses: metrics.accessCount,
        category: metrics.category,
        lastAccess: formatTimeAgo(metrics.lastAccessed)
      }));
      
    if (fileHeatmap.length > 0) {
      contextInfo.fileHeatmap = fileHeatmap;
    }
    
    // Add pending tests
    if (contextState.pendingTests.size > 0) {
      contextInfo.pendingTests = Array.from(contextState.pendingTests);
    }
    
    // Add code change summary for edit operations
    if (toolName === 'edit_block' && args) {
      const changeContext = extractCodeChangeContext(args);
      if (changeContext) {
        contextInfo.codeChange = {
          type: changeContext.changeType,
          pattern: changeContext.pattern,
          size: `${changeContext.charactersAdded > 0 ? '+' : ''}${changeContext.charactersAdded}`,
          defensive: changeContext.isDefensive
        };
      }
    }
    
    // ... rest of existing function ...
  } catch (error) {
    // ... existing error handling ...
  }
}

// ============================================================================
// RESULT: Enhanced log entries that enable rich recovery output
// ============================================================================

/* Example enhanced log entry:
{
  "timestamp": "2025-01-25T10:30:00Z",
  "toolName": "edit_block",
  "contextInfo": {
    "session": "abc123",
    "intent": "Debug JWT token validation error",
    "intentConfidence": 85,
    "operationChains": [{
      "id": "auth-debug-x7y2",
      "purpose": "Debug JWT token validation error",
      "progress": "80%",
      "toolSequence": "search_code→read_file→read_file→edit_block",
      "pendingSteps": ["test:middleware.js"]
    }],
    "searchEvolution": {
      "patterns": ["undefined", "undefined token", "jwt undefined"],
      "conclusion": "Found in middleware.js line 127"
    },
    "fileHeatmap": [
      {"file": "middleware.js", "accesses": 7, "category": "focus"},
      {"file": "auth.test.js", "accesses": 4, "category": "test"}
    ],
    "codeChange": {
      "type": "expansion",
      "pattern": "validation", 
      "size": "+87",
      "defensive": true
    },
    "pendingTests": ["middleware.js"]
  }
}
*/
