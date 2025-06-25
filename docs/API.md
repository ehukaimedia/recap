# API Documentation - RecapMCP

## Overview

RecapMCP exposes a single tool through the Model Context Protocol (MCP) that provides intelligent analysis of DesktopCommanderMCP activity logs.

## Tool: `recap`

Analyzes DesktopCommanderMCP logs and provides contextual insights with intent detection.

### Parameters

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `hours` | number | 24 | 1-168 | Hours of activity to analyze |
| `verbose` | boolean | false | - | Include detailed session breakdown |
| `format` | string | "text" | text, json, handoff, recovery | Output format |
| `professional` | boolean | false | - | Use professional formatting without emojis |
| `recovery` | boolean | false | - | Enable recovery mode for interrupted sessions |

### Parameter Details

#### `hours`
- Specifies how far back to analyze logs
- Maximum 168 hours (7 days) to prevent memory issues
- Shorter ranges provide faster analysis

#### `verbose`
- Adds detailed file lists and operation breakdowns
- Useful for debugging and deep analysis
- Increases output size significantly

#### `format`
- **text**: Human-readable format with emojis (default)
- **json**: Structured data for programmatic use
- **handoff**: Formatted for session continuity
- **recovery**: Quick recovery after interruptions
#### `professional`
- Removes emojis and decorative elements
- Uses clean, business-appropriate formatting
- Maintains all information content

#### `recovery`
- Optimized for quick context restoration
- Focuses on most recent incomplete work
- Includes pending operations and state

### Request Examples

#### Basic Recap
```json
{
  "hours": 24
}
```

#### Detailed Analysis
```json
{
  "hours": 8,
  "verbose": true
}
```

#### Professional Report
```json
{
  "hours": 48,
  "format": "text",
  "professional": true
}
```

#### JSON Export
```json
{
  "hours": 168,
  "format": "json"
}
```

#### Recovery Mode
```json
{
  "format": "recovery",
  "recovery": true
}
```

#### Session Handoff
```json
{
  "format": "handoff",
  "hours": 4
}
```
### Response Formats

#### Text Format Response
```
🔄 CONTEXTUAL RECAP
═══════════════════════════════════════════════════
📅 Time Range: Today, 9:00 AM → just now
⚡ Activity: 23 tool calls across 2 sessions

📊 RECENT SESSIONS

**Session abc123** (45m) - 2h ago
  Project: E-commerce API
  Workflows: DEBUGGING, EDITING
  🧠 Intent: Debug and fix identified error (reactive) 75%
  Files: server.js, auth.middleware.js
  Operations: 15 tools

🎯 NARRATIVE SUMMARY
Primary focus on debugging authentication issues...
```

#### JSON Format Response
```json
{
  "summary": {
    "totalSessions": 2,
    "totalDuration": 45,
    "totalOperations": 23,
    "primaryProjects": ["E-commerce API"],
    "workflowDistribution": {
      "DEBUGGING": 15,
      "EDITING": 8
    },
    "timeRange": {
      "start": "2025-06-25T09:00:00.000Z",
      "end": "2025-06-25T10:30:00.000Z"
    }
  },
  "sessions": [
    {
      "id": "abc123",
      "startTime": "2025-06-25T09:00:00.000Z",
      "duration": 45,
      "primaryProject": "E-commerce API",
      "workflowPatterns": ["DEBUGGING", "EDITING"],
      "filesAccessed": ["server.js", "auth.middleware.js"],
      "operationCount": 15,
      "primaryIntent": "Debug and fix identified error",
      "workPattern": "reactive",
      "intentConfidence": 75
    }
  ]
}
```
#### Handoff Format Response
```
# Project Handoff - 2025-06-25

## Session Summary
**Duration**: 9:00 AM - 10:30 AM
**Main Goal**: Fix authentication bugs
**Outcome**: Identified root cause, partial fix

## Current State
Branch: fix/auth-middleware
Files Modified: 
- server.js
- auth.middleware.js
- tests/auth.test.js

## Next Steps
1. Complete JWT validation fix
2. Update test cases
3. Run integration tests
```

#### Recovery Format Response
```
🚨 RECOVERY MODE
Last Session: 10 minutes ago (interrupted)
Project: E-commerce API
Working on: Authentication middleware

⚠️ Pending Operations:
- Uncommitted changes in auth.middleware.js
- Failed test: auth.test.js line 45

🎯 Quick Recovery:
1. Check git status
2. Review auth.middleware.js changes
3. Fix failing test
4. Continue with JWT validation
```

### Error Responses

#### Invalid Parameters
```json
{
  "error": "Invalid parameter",
  "message": "Hours must be between 1 and 168",
  "code": "INVALID_PARAM"
}
```

#### Log File Not Found
```json
{
  "error": "Log file not found",
  "message": "No log file at ~/.claude-server-commander/claude_tool_call.log",
  "code": "LOG_NOT_FOUND"
}
```

#### Timeout Error
```json
{
  "error": "Analysis timeout",
  "message": "Log analysis exceeded 30000ms timeout",
  "code": "TIMEOUT"
}
```

### Intent Detection

The API returns intent detection with confidence scores:

| Intent | Confidence Range | Description |
|--------|------------------|-------------|
| Error-driven debugging | 60-90% | Reactive problem-solving |
| Planned development | 50-85% | Proactive feature work |
| Exploratory investigation | 40-75% | Learning and discovery |
| Maintenance work | 45-70% | Refactoring and optimization |

### Workflow Patterns

Detected workflow patterns include:
- **EXPLORATION**: Reading files, searching code
- **EDITING**: Modifying files, writing code
- **DEBUGGING**: Error investigation, test fixes
- **SETUP**: Project initialization, configuration
- **ANALYSIS**: Code review, performance checks

### Environment Variables

Configure the API behavior with environment variables:

```bash
# Custom log location
export RECAP_LOG_PATH="/custom/path/to/logs"

# Analysis timeout (milliseconds)
export RECAP_TIMEOUT=60000

# Maximum sessions to analyze
export RECAP_MAX_SESSIONS=100
```

### Usage with Claude

In Claude Desktop, use natural language:
- "Give me a recap of my work today"
- "Show verbose output for last 8 hours"
- "Create a handoff document"
- "I need a recovery recap"

### Rate Limits

- No rate limits for local MCP usage
- Analysis may slow with >1000 sessions
- Memory usage increases with time range

### Best Practices

1. Use shorter time ranges for faster results
2. Enable verbose mode for debugging
3. Use JSON format for automation
4. Recovery mode after interruptions
5. Professional mode for reports

### Troubleshooting

**Empty results**: Check log file exists and has recent entries
**Low confidence**: Ensure varied tool usage in sessions
**Slow analysis**: Reduce time range or session limit
**Missing intents**: Verify enhanced DesktopCommanderMCP version