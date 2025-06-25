/**
 * Enhanced Tool Call Tracking with Recovery-Focused Improvements
 * 
 * CHANGES FOR RECOVERY MODE:
 * 1. Enhanced edit context with size/ratio/pattern detection
 * 2. Operation chain tracking for incomplete task detection
 * 3. File metadata collection for better context
 * 4. Search evolution tracking
 * 5. Recovery checkpoint triggers
 * 
 * All changes are backward compatible and only enhance the logged data.
 */

// Add these interfaces after the existing ones (around line 50)

/**
 * Enhanced edit context for better recovery information
 */
interface EnhancedEditContext extends EditContext {
  editSize: number;
  editRatio: number; // new_size / old_size
  codePattern?: 'function' | 'import' | 'interface' | 'class' | 'variable' | 'config';
  estimatedLineNumber?: number;
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
  expectedPattern?: string; // e.g., "search→read→edit→test"
  tools: string[];
  files: Set<string>;
  isComplete: boolean;
  needsVerification: string[]; // what operations need verification
}

/**
 * Enhanced context state with recovery features
 */
interface EnhancedContextState extends ContextState {
  // Existing fields remain...
  
  // New recovery-focused fields
  operationChains: Map<string, OperationChain>;
  pendingVerifications: Array<{
    tool: string;
    target: string;
    timestamp: Date;
    reason: string;
  }>;
  lastCheckpoint?: Date;
  fileMetadata: Map<string, {
    size?: number;
    lastModified?: Date;
    extension: string;
    accessCount: number;
  }>;
  searchEvolution: Map<string, string[]>; // pattern -> evolution
}

// Update the contextState initialization (around line 95)
let enhancedContextState: EnhancedContextState = {
  recentFiles: [],
  toolSequence: [],
  recentSearches: [],
  searchContext: new Map(),
  recentArgs: [],
  intentSignals: [],
  workPattern: 'proactive',
  // New fields
  operationChains: new Map(),
  pendingVerifications: [],
  fileMetadata: new Map(),
  searchEvolution: new Map()
};

// Add these new functions after the existing helper functions (around line 500)

/**
 * Detect code patterns in edit operations for better context
 */
function detectCodePattern(oldString?: string, newString?: string): string | undefined {
  const content = newString || oldString || '';
  
  if (content.includes('function') || content.includes('=>')) return 'function';
  if (content.includes('import') || content.includes('require')) return 'import';
  if (content.includes('interface') || content.includes('type ')) return 'interface';
  if (content.includes('class ')) return 'class';
  if (content.includes('const ') || content.includes('let ') || content.includes('var ')) return 'variable';
  if (content.includes('config') || content.includes('.env')) return 'config';
  
  return undefined;
}

/**
 * Track operation chains for recovery
 */
function updateOperationChains(toolName: string, args: any): void {
  const chains = enhancedContextState.operationChains;
  
  // Check if this starts a new chain
  if (toolName === 'search_code' || toolName === 'search_files') {
    const chainId = `chain_${Date.now()}`;
    chains.set(chainId, {
      id: chainId,
      startTime: new Date(),
      startTool: toolName,
      expectedPattern: 'search→read→edit→test',
      tools: [toolName],
      files: new Set(extractFilePaths(args)),
      isComplete: false,
      needsVerification: []
    });
  } else {
    // Update existing chains
    for (const [id, chain] of chains) {
      // Chain is recent (within 10 minutes)
      if (Date.now() - chain.startTime.getTime() < 10 * 60 * 1000) {
        chain.tools.push(toolName);
        extractFilePaths(args).forEach(f => chain.files.add(f));
        
        // Check if chain needs verification
        if (toolName === 'edit_block' || toolName === 'write_file') {
          chain.needsVerification.push('test_execution');
        }
        
        // Check if chain is complete
        if (toolName === 'execute_command' && args?.command?.includes('test')) {
          chain.isComplete = true;
        }
      }
    }
  }
  
  // Clean old chains (older than 30 minutes)
  for (const [id, chain] of chains) {
    if (Date.now() - chain.startTime.getTime() > 30 * 60 * 1000) {
      chains.delete(id);
    }
  }
}

/**
 * Track pending verifications for recovery
 */
function trackPendingVerification(toolName: string, args: any): void {
  if (toolName === 'edit_block' || toolName === 'write_file') {
    const target = args.file_path || args.path || 'unknown';
    enhancedContextState.pendingVerifications.push({
      tool: toolName,
      target,
      timestamp: new Date(),
      reason: 'File modified without test verification'
    });
  }
  
  // Clear verifications when tests run
  if (toolName === 'execute_command' && args?.command?.includes('test')) {
    enhancedContextState.pendingVerifications = 
      enhancedContextState.pendingVerifications.filter(v => 
        Date.now() - v.timestamp.getTime() > 5 * 60 * 1000 // Keep only old ones
      );
  }
}

/**
 * Enhanced edit context extraction
 */
function extractEnhancedEditContext(toolName: string, args: any): EnhancedEditContext | null {
  const basicContext = extractEditLocation(toolName, args);
  if (!basicContext) return null;
  
  const oldSize = args.old_string?.length || 0;
  const newSize = args.new_string?.length || 0;
  
  return {
    ...basicContext,
    editSize: Math.abs(newSize - oldSize),
    editRatio: oldSize > 0 ? newSize / oldSize : newSize,
    codePattern: detectCodePattern(args.old_string, args.new_string),
    isCreation: oldSize === 0 && newSize > 0,
    isDeletion: oldSize > 0 && newSize === 0,
    fileExtension: args.file_path ? path.extname(args.file_path) : undefined
  };
}

/**
 * Track file metadata for better recovery context
 */
function updateFileMetadata(filePath: string, toolName: string): void {
  const metadata = enhancedContextState.fileMetadata.get(filePath) || {
    extension: path.extname(filePath),
    accessCount: 0
  };
  
  metadata.accessCount++;
  metadata.lastModified = new Date();
  
  enhancedContextState.fileMetadata.set(filePath, metadata);
}

/**
 * Track search evolution for pattern analysis
 */
function trackSearchEvolution(pattern: string): void {
  const normalizedPattern = pattern.toLowerCase().trim();
  
  // Find similar patterns
  for (const [existingPattern, evolution] of enhancedContextState.searchEvolution) {
    if (existingPattern.includes(normalizedPattern) || normalizedPattern.includes(existingPattern)) {
      evolution.push(pattern);
      return;
    }
  }
  
  // New search pattern
  enhancedContextState.searchEvolution.set(normalizedPattern, [pattern]);
}

/**
 * Determine if a recovery checkpoint should be saved
 */
function shouldSaveCheckpoint(toolName: string, toolCount: number): boolean {
  const lastCheckpoint = enhancedContextState.lastCheckpoint;
  const timeSinceCheckpoint = lastCheckpoint ? 
    Date.now() - lastCheckpoint.getTime() : Infinity;
  
  // Checkpoint triggers
  return (
    // Every 10 tools
    toolCount % 10 === 0 ||
    // After critical operations
    (toolName === 'execute_command' && timeSinceCheckpoint > 2 * 60 * 1000) ||
    // Every 5 minutes of activity
    timeSinceCheckpoint > 5 * 60 * 1000 ||
    // When operation chains complete
    Array.from(enhancedContextState.operationChains.values()).some(c => c.isComplete)
  );
}

// Modify the main trackToolCall function to use enhanced tracking
// Add this right after storing recent args (around line 900)

// In the main trackToolCall function, add after contextState.recentArgs tracking:

    // Enhanced tracking for recovery mode
    updateOperationChains(toolName, args);
    trackPendingVerification(toolName, args);
    
    // Track search evolution
    if ((toolName === 'search_code' || toolName === 'search_files') && args?.pattern) {
      trackSearchEvolution(args.pattern);
    }
    
    // Update file metadata
    for (const filePath of extractFilePaths(args)) {
      updateFileMetadata(filePath, toolName);
    }
    
    // Check for checkpoint trigger
    const totalToolCount = contextState.toolSequence.length;
    if (shouldSaveCheckpoint(toolName, totalToolCount)) {
      enhancedContextState.lastCheckpoint = new Date();
      contextInfo.checkpointTrigger = true;
    }

// Update the context info building section (around line 950) to include recovery data:

    // Add recovery-focused information
    if (enhancedContextState.operationChains.size > 0) {
      const activeChains = Array.from(enhancedContextState.operationChains.values())
        .filter(c => !c.isComplete);
      if (activeChains.length > 0) {
        contextInfo.activeOperationChains = activeChains.map(c => ({
          id: c.id,
          pattern: c.tools.join('→'),
          needsVerification: c.needsVerification,
          files: Array.from(c.files)
        }));
      }
    }
    
    // Add pending verifications
    if (enhancedContextState.pendingVerifications.length > 0) {
      contextInfo.pendingVerifications = enhancedContextState.pendingVerifications
        .slice(-3) // Last 3
        .map(v => ({
          tool: v.tool,
          target: path.basename(v.target),
          age: `${Math.round((Date.now() - v.timestamp.getTime()) / 1000 / 60)}m ago`
        }));
    }
    
    // Add enhanced edit context
    const enhancedEdit = extractEnhancedEditContext(toolName, args);
    if (enhancedEdit) {
      contextInfo.editMetadata = {
        size: enhancedEdit.editSize,
        ratio: enhancedEdit.editRatio.toFixed(2),
        pattern: enhancedEdit.codePattern,
        type: enhancedEdit.isCreation ? 'creation' : 
              enhancedEdit.isDeletion ? 'deletion' : 'modification'
      };
    }
    
    // Add file metadata summary
    if (contextState.recentFiles.length > 0) {
      const fileStats = contextState.recentFiles.map(f => {
        const meta = enhancedContextState.fileMetadata.get(f);
        return {
          name: path.basename(f),
          accesses: meta?.accessCount || 1,
          extension: meta?.extension || path.extname(f)
        };
      });
      contextInfo.fileActivity = fileStats;
    }
    
    // Add search evolution if present
    if (enhancedContextState.searchEvolution.size > 0) {
      const recentEvolution = Array.from(enhancedContextState.searchEvolution.entries())
        .slice(-3)
        .map(([pattern, evolution]) => ({
          original: pattern,
          refined: evolution.length > 1 ? evolution[evolution.length - 1] : undefined
        }));
      if (recentEvolution.some(e => e.refined)) {
        contextInfo.searchRefinement = recentEvolution;
      }
    }
