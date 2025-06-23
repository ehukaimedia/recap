# RecapMCP - Intelligent Productivity Analysis

> Transform your DesktopCommanderMCP tool usage into intelligent insights that understand WHY you work, not just WHAT tools you use.

[![npm version](https://img.shields.io/npm/v/@ehukaimedia/recap-mcp.svg)](https://www.npmjs.com/package/@ehukaimedia/recap-mcp)
[![GitHub](https://img.shields.io/badge/GitHub-ehukaimedia%2Frecap-blue.svg)](https://github.com/ehukaimedia/recap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## Overview

RecapMCP is a professional Model Context Protocol (MCP) server that provides **intelligent intent detection** and productivity analysis of DesktopCommanderMCP activity logs. Instead of basic tool counts, get rich contextual insights about your development intentions, workflow patterns, and productivity flows.

## 🎯 Key Innovation: Intent Detection

RecapMCP uses advanced pattern analysis to understand **why** you're working:

- **Error-Driven Debugging** - Detects when you're investigating and fixing issues
- **Planned Development** - Recognizes systematic feature implementation
- **Exploratory Investigation** - Identifies learning and discovery activities  
- **Maintenance Work** - Spots refactoring and optimization tasks

Each detected intent includes **confidence scoring** and **evidence-based explanations**.

## Features

- 🧠 **Intelligent Intent Detection** - Understands your development intentions with 4 detection algorithms
- 📊 **Evidence-Based Analysis** - Clear explanations for detected work patterns
- 🎯 **Confidence Scoring** - 25-90% confidence levels with transparent reasoning
- 🔄 **Session Detection** - Automatic work session boundaries with intelligent timeouts
- 🏗️ **Project Context** - Identifies projects from working directories  
- 🔧 **Workflow Analysis** - Recognizes patterns (EXPLORATION, EDITING, DEBUGGING, SETUP, ANALYSIS)
- 📈 **Rich Narratives** - Transform tool logs into meaningful productivity insights
- 🚀 **Native Claude Integration** - Works seamlessly as a Claude Desktop tool
- ⚡ **Real-time Analysis** - Parse logs on-demand with flexible time ranges
- 🛡️ **Type Safe** - Full TypeScript implementation with Zod validation

## Quick Start

### Prerequisites

Enhanced DesktopCommanderMCP with intelligent intent detection:
```bash
git clone https://github.com/ehukaimedia/DesktopCommanderMCP-Recap.git
cd DesktopCommanderMCP-Recap
npm install && npm run build
npm install -g .
```

### Get RecapMCP

**Clone from GitHub:**
```bash
git clone https://github.com/ehukaimedia/recap.git
cd recap
```

**Or with SSH:**
```bash
git clone git@github.com:ehukaimedia/recap.git
cd recap
```

### Installation

**One-command setup (recommended):**
```bash
npm install
npm run setup
```

**Or use platform-specific shortcuts:**
```bash
# Mac/Linux
./scripts/setup.sh

# Windows  
scripts/setup.bat
```

## Usage

Once installed, restart Claude Desktop and use natural language:

```
"Can you give me a recap of my recent work?"
"What did I work on today?" 
"Show me my activity from the last 8 hours"
"Give me a detailed breakdown with verbose output"
```

### Example Output with Intent Detection

```
🔄 CONTEXTUAL RECAP
═══════════════════════════════════════════════════
📅 Time Range: Today, 9:00 AM → just now
⚡ Activity: 23 tool calls across 2 sessions

📊 RECENT SESSIONS

**Session abc123** (45m) - 2h ago
  Project: E-commerce API
  Workflows: DEBUGGING, EDITING
  🧠 Intent: Debug and fix identified error or test failure (reactive) 75%
  Files: server.js, auth.middleware.js, tests/
  Operations: 15 tools

**Session def456** (12m) - 30m ago
  Project: Database Migration  
  Workflows: SETUP
  🧠 Intent: Implement new feature following planned approach (proactive) 68%
  Files: migration_001.sql, config.yml
  Operations: 8 tools

🎯 NARRATIVE SUMMARY
Worked for 57 minutes across 2 focused sessions. Primary focus: 
E-commerce API development. Main activity: DEBUGGING workflow. 
Touched 8 files. Started with reactive debugging work, then moved 
to planned development tasks.
```

## Intent Detection in Action

### Error-Driven Debugging Pattern
When you search for "error", "undefined", or read error logs, RecapMCP detects:
```
🧠 Intent: Debug and fix identified error or test failure (reactive) 75%
Evidence: Error-related search terms, Working with test files
```

### Planned Development Pattern  
When you create directories, write type definitions, then implement features:
```
🧠 Intent: Implement new feature following planned approach (proactive) 68%
Evidence: Working with type definitions, Creating new files systematically
```

### Exploratory Investigation Pattern
When you read multiple files, explore directories, search without editing:
```
🧠 Intent: Understand codebase structure (investigative) 62%
Evidence: High exploration ratio, Multiple directory explorations
```

### Maintenance Work Pattern
When you make multiple small edits, work with config files, run builds:
```
🧠 Intent: Perform maintenance, refactoring, or optimization tasks (maintenance) 58%
Evidence: Multiple edits, Configuration file modifications
```

## API Reference

### Tool: `recap`

**Parameters:**
- `hours` (number, 1-168, default: 24) - Hours of activity to analyze
- `verbose` (boolean, default: false) - Include detailed session breakdown  
- `format` ("text" | "json" | "handoff", default: "text") - Output format
- `professional` (boolean, default: false) - Use professional formatting without emojis

**Examples:**
```javascript
// Basic recap with intent detection
{ "hours": 24 }

// Detailed analysis with intent evidence
{ "hours": 8, "verbose": true }

// JSON export with intent metadata
{ "hours": 48, "format": "json" }

// Professional handoff format
{ "format": "handoff", "professional": true }
```

## Enhanced Logging Format with Intent Data

RecapMCP analyzes enhanced DesktopCommanderMCP logs with intelligent context:

```json
{
  "timestamp": "2025-06-22T20:42:38.692Z",
  "tool": "search_code", 
  "context": {
    "session": "mc84wf6s_u7w54r",
    "sessionAge": "15m",
    "project": "E-commerce API",
    "workflow": "DEBUGGING",
    "intent": "Debug and fix identified error or test failure",
    "intentConfidence": 75,
    "workPattern": "reactive",
    "intentEvidence": [
      "Error-related search term: \"undefined\"",
      "Working with test files or logs"
    ],
    "files": ["server.js"]
  },
  "args": {"pattern": "undefined", "path": "./src"}
}
```

## Configuration

### Claude Desktop Integration

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "node",
      "args": [
        "/path/to/DesktopCommanderMCP-Recap/dist/index.js"
      ]
    },
    "recap": {
      "command": "node", 
      "args": [
        "/path/to/recap/dist/index.js"
      ]
    }
  }
}
```

### Environment Variables

- `RECAP_LOG_PATH` - Override default DesktopCommanderMCP log location
- `RECAP_MAX_SESSIONS` - Maximum sessions to analyze (default: 50)
- `RECAP_TIMEOUT` - Analysis timeout in milliseconds (default: 30000)

## Project Structure

```
RecapMCP/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── server.ts          # Server setup and tool registration
│   ├── recap.ts           # Core analysis and intent detection
│   └── types.ts           # TypeScript types with intent interfaces
├── tests/                 # Intent detection validation tests
├── scripts/               # Setup and installation scripts
├── docs/                  # Documentation
├── dist/                  # Compiled JavaScript output
└── README.md              # This file
```

## Development

### Requirements

- Node.js 18+
- TypeScript 5.3+
- Enhanced DesktopCommanderMCP with intent detection

### Scripts

```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation  
npm run setup      # Complete installation & configuration
npm run test       # Test intent detection functionality
npm start          # Run the MCP server
```

### Testing Intent Detection

```bash
# Run intent detection validation
cd tests && node intent-detection-validation.cjs

# Test implementation readiness
cd tests && node implementation-ready.cjs

# Run comprehensive testing suite
npm test
```

## Troubleshooting

### Common Issues

**No intent detection shown:**
- Ensure you're using enhanced DesktopCommanderMCP-Recap version
- Restart Claude Desktop after installation
- Verify enhanced logs contain intent fields

**Claude doesn't see the recap tool:**
- Check Claude Desktop config points to correct dist/index.js
- Verify MCP server starts without errors: `node dist/index.js`

**Low confidence or missing intents:**
- Intent detection requires 2+ tool calls for pattern analysis
- Try longer activity sessions for better detection
- Check that enhanced logging is active in DesktopCommanderMCP

**Empty or missing analysis:**
- Check log file exists: `~/.claude-server-commander/claude_tool_call.log`
- Verify recent activity has enhanced format with intent data
- Try longer time range: `"hours": 48`

## Related Projects

- **[Enhanced DesktopCommanderMCP-Recap](https://github.com/ehukaimedia/DesktopCommanderMCP-Recap)** - Enhanced version with intent detection engine
- **[Original DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP)** - Base tool implementation
- **[Model Context Protocol](https://github.com/modelcontextprotocol)** - MCP specification

## Changelog

### v2.0.0 - Intelligent Intent Detection
- **Revolutionary Feature**: 4-algorithm intent detection system
- **Evidence-Based Analysis**: Clear explanations for detected patterns
- **Confidence Scoring**: 25-90% confidence with transparent reasoning
- **Work Pattern Classification**: Reactive, proactive, investigative, maintenance
- **Enhanced Display**: 🧠 Intent insights in natural language
- **Session Intelligence**: Context-aware analysis across related activities

### v1.0.0 - Initial Release
- MCP server implementation
- Basic session analysis and workflow pattern detection
- Cross-platform setup automation
- Claude Desktop integration
- TypeScript implementation with Zod validation

## Contributing

We welcome contributions! The intent detection system opens many possibilities for enhancement:

1. **Fork the repository**: Visit [https://github.com/ehukaimedia/recap](https://github.com/ehukaimedia/recap)
2. **Clone your fork**: `git clone https://github.com/YOUR-USERNAME/recap.git`
3. **Create a feature branch**: `git checkout -b feature/intent-enhancement`
4. **Test thoroughly**: Run intent detection validation tests
5. **Submit a Pull Request**: Include test results and documentation updates

### Development Guidelines

- Follow TypeScript strict mode
- Add tests for new intent detection patterns
- Update documentation for API changes
- Ensure intent detection algorithms are well-tested
- Maintain backwards compatibility

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Transform your development activity logs into intelligent productivity insights that understand your intentions.** ✨

*RecapMCP v2.0 - Now with groundbreaking intent detection capabilities!*
