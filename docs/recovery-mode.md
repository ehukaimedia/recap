# Recovery Mode Documentation

## Overview

RecapMCP now includes specialized **Recovery Mode** features designed to help during Claude timeouts, server disruptions, or when you need to quickly resume interrupted work.

## Features

### 1. **Automatic Interrupted Session Detection**
Recap automatically detects when a session was likely interrupted by checking for:
- Recent activity (< 10 minutes ago)
- Incomplete operations (edits without tests, searches without actions)
- Pending commands without result verification

### 2. **Quick Recovery Command**
Use the recovery format for instant context restoration:
```
"Give me a recovery recap"
"Use recovery mode"
"Show me {"format": "recovery"}"
```

### 3. **Recovery Context Information**
Recovery mode provides:
- **Last Activity Time** - How long ago you were working
- **Working Directory** - Where you were working
- **Active File** - Last file being edited
- **Pending Operations** - Unfinished tasks detected
- **Uncommitted Changes** - Files edited but not committed
- **Last Error** - Any detected errors before interruption
- **Suggested Next Steps** - AI-powered action recommendations

### 4. **State Checkpoints**
Recap automatically saves checkpoints of your work state that include:
- Session ID and timestamp
- Current project and workflow patterns
- Recent tool usage history
- Intent detection data
- Files accessed

## Usage Examples

### Basic Recovery
```
User: "Give me a recovery recap"

QUICK RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Last Activity: 3 minutes ago
Working On: E-commerce API
Last Tool: edit_block
Active File: /src/auth/middleware.js
Directory: /Users/ehukaimedia/Desktop/AI-Applications/Node/E-commerce-API

PENDING OPERATIONS:
• File edited but not tested
• Search performed but no action taken

UNCOMMITTED FILES:
• /src/auth/middleware.js
• /src/routes/user.js

SUGGESTED NEXT STEPS:
1. Test changes to /src/auth/middleware.js
2. Review search results for "undefined"
3. Continue debugging the identified issue
```

### Recovery After Timeout
```
User: "Claude timed out while we were debugging. Help me recover"

// Recap will automatically:
// 1. Detect the interrupted session
// 2. Show pending operations
// 3. Identify uncommitted changes
// 4. Suggest concrete next steps
```

### Handoff Mode with Recovery Info
```
User: "Show me a handoff with recovery info"

// The handoff now includes:
// - Warning about interrupted sessions
// - Quick recovery command reminder
// - More detailed state information
```

## Implementation Details

### Recovery Detection Algorithm
```typescript
function detectInterruptedSession(sessions: Session[]): Session | null {
  // Check if last activity was < 10 minutes ago
  // AND session has incomplete operations
  // Operations considered incomplete:
  // - edit_block without test/save
  // - write_file without verification
  // - execute_command without result check
  // - search_code without follow-up action
}
```

### Recovery Context Generation
The recovery context analyzes:
1. **Pending Operations** - What was started but not finished
2. **Uncommitted Changes** - Files modified without git commit
3. **Last Error** - Detected from error searches after commands
4. **Working State** - Directory, project, active files
5. **Suggested Actions** - Based on workflow patterns and pending ops

### State Persistence
Checkpoints are saved to:
```
~/.claude-server-commander/last_checkpoint.json
```

## Best Practices

### 1. **Enable Recovery Mode During Critical Work**
When working on important tasks, periodically use:
```
"Save a checkpoint of my current work"
```

### 2. **Use Recovery Format After Disruptions**
After any timeout or error:
```
{"format": "recovery"}
```

### 3. **Review Pending Operations**
Recovery mode highlights incomplete work to prevent losing changes

### 4. **Follow Suggested Actions**
The AI-generated suggestions are based on:
- Your detected intent
- Workflow patterns
- Pending operations
- Common development practices

## Advanced Features

### Custom Recovery Patterns
You can extend recovery detection by adding patterns to `recovery.ts`:
```typescript
const incompletePatterns = [
  ['edit_block'], // Edit without save/test
  ['write_file'], // Write without verification
  // Add your custom patterns
];
```

### Recovery Hooks
Future versions will support:
- Auto-recovery on new session start
- Git status integration
- Test result persistence
- Build status tracking

## Troubleshooting

### Recovery Not Detecting Interruption
- Ensure activity was within 10 minutes
- Check that enhanced logging is active
- Verify incomplete operations exist

### Missing Suggested Actions
- Longer sessions provide better context
- More tool usage improves suggestions
- Intent detection enhances recommendations

### Checkpoint Issues
- Check write permissions to ~/.claude-server-commander/
- Ensure sufficient disk space
- Verify JSON validity if manually editing

## Integration with Claude

### Automatic Recovery
When Claude reconnects after a timeout, simply ask:
```
"What was I working on?"
"Show me recovery mode"
"Help me continue where I left off"
```

### Seamless Continuation
Recovery mode provides everything needed to resume:
1. Working directory to navigate to
2. Files that need attention
3. Pending operations to complete
4. Suggested next steps

This ensures minimal context loss during disruptions.
