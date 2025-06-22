# RecapMCP - Intelligent Activity Analysis

> Transform your DesktopCommanderMCP tool usage into intelligent contextual insights with native Claude integration.

[![npm version](https://img.shields.io/npm/v/@ehukaimedia/recap-mcp.svg)](https://www.npmjs.com/package/@ehukaimedia/recap-mcp)
[![GitHub](https://img.shields.io/badge/GitHub-ehukaimedia%2Frecap-blue.svg)](https://github.com/ehukaimedia/recap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## Overview

RecapMCP is a professional Model Context Protocol (MCP) server that provides intelligent analysis of DesktopCommanderMCP activity logs. Instead of basic tool counts, get rich contextual narratives about your development sessions, workflow patterns, and productivity insights.

## Features

- 🔄 **Session Detection** - Automatic work session boundaries with intelligent timeouts
- 🎯 **Project Context** - Identifies projects from working directories  
- 🔧 **Workflow Analysis** - Recognizes patterns (EXPLORATION, EDITING, DEBUGGING, SETUP, ANALYSIS)
- 📊 **Rich Narratives** - Transform tool logs into meaningful productivity insights
- 🚀 **Native Claude Integration** - Works seamlessly as a Claude Desktop tool
- ⚡ **Real-time Analysis** - Parse logs on-demand with flexible time ranges
- 🛡️ **Type Safe** - Full TypeScript implementation with Zod validation

## Quick Start

### Prerequisites

Enhanced DesktopCommanderMCP with contextual logging:
```bash
npm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging
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

**Install directly from GitHub:**
```bash
# Clone and setup
git clone https://github.com/ehukaimedia/recap.git
cd recap
npm install
npm run setup

# Or install globally from GitHub
npm install -g git+https://github.com/ehukaimedia/recap.git
```

### Manual Installation

```bash
# Install dependencies
npm install

# Build the MCP server
npm run build

# Install globally (optional)
npm install -g .

# Configure Claude Desktop manually
# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "recap": {
      "command": "recap-mcp",
      "args": []
    }
  }
}
```

## Usage

Once installed, restart Claude Desktop and use natural language:

```
"Can you give me a recap of my recent work?"
"What did I work on today?"
"Show me my activity from the last 8 hours"
"Give me a detailed breakdown with verbose output"
```

### Example Output

```
🔄 CONTEXTUAL RECAP
═══════════════════════════════════════════════════
📅 Time Range: Today, 9:00 AM → just now
⚡ Activity: 23 tool calls across 2 sessions

📊 RECENT SESSIONS

**Session abc123** (45m) - 2h ago
  Project: E-commerce API
  Workflows: SETUP, EDITING, TESTING
  Files: server.js, auth.middleware.js, tests/
  Operations: 15 tools

**Session def456** (12m) - 30m ago
  Project: Database Migration  
  Workflows: DEBUGGING
  Files: migration_001.sql, config.yml
  Operations: 8 tools

🎯 NARRATIVE SUMMARY
Worked for 57 minutes across 2 focused sessions. Primary focus: 
E-commerce API development. Main activity: SETUP→EDITING→TESTING 
workflow. Touched 8 files. Completed authentication middleware 
and resolved database migration issues.
```

## API Reference

### Tool: `recap`

**Parameters:**
- `hours` (number, 1-168, default: 24) - Hours of activity to analyze
- `verbose` (boolean, default: false) - Include detailed session breakdown  
- `format` ("text" | "json", default: "text") - Output format

**Examples:**
```javascript
// Basic recap
{ "hours": 24 }

// Detailed last 8 hours
{ "hours": 8, "verbose": true }

// JSON export
{ "hours": 48, "format": "json" }
```

## Project Structure

```
RecapMCP/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── server.ts          # Server setup and tool registration
│   ├── recap.ts           # Core analysis functionality
│   └── types.ts           # TypeScript type definitions
├── scripts/
│   ├── setup.mjs          # Cross-platform setup automation
│   ├── setup.sh           # Unix setup script
│   └── setup.bat          # Windows setup script  
├── docs/                  # Documentation and legacy files
├── dist/                  # Compiled JavaScript output
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Development

### Requirements

- Node.js 18+
- TypeScript 5.3+
- Enhanced DesktopCommanderMCP

### Scripts

```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation
npm run setup      # Complete installation & configuration
npm run test       # Test MCP server functionality
npm start          # Run the MCP server
```

### Building

```bash
# Development build
npm run build

# Production build with optimization
npm run build --production
```

### Testing

```bash
# Test server functionality
npm test

# Manual testing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Configuration

### Claude Desktop Integration

The setup script automatically configures Claude Desktop. Manual configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "recap": {
      "command": "recap-mcp",
      "args": []
    }
  }
}
```

### Environment Variables

- `RECAP_LOG_PATH` - Override default DesktopCommanderMCP log location
- `RECAP_MAX_SESSIONS` - Maximum sessions to analyze (default: 50)
- `RECAP_TIMEOUT` - Analysis timeout in milliseconds (default: 30000)

## Enhanced Logging Format

RecapMCP analyzes enhanced DesktopCommanderMCP logs with rich contextual data:

```json
{
  "timestamp": "2025-06-22T20:42:38.692Z",
  "tool": "list_directory", 
  "context": {
    "session": "mc84wf6s_u7w54r",
    "sessionAge": "0m",
    "newSession": true,
    "project": "Recap",
    "workflow": "EXPLORATION", 
    "files": ["README.md"]
  },
  "args": {"path": "..."}
}
```

## Troubleshooting

### Common Issues

**Claude doesn't see the recap tool:**
- Restart Claude Desktop after installation
- Check Claude Desktop config file exists and is valid JSON
- Verify MCP server starts without errors: `node dist/index.js`

**Permission denied during setup:**
- Run with appropriate permissions: `sudo npm run setup`
- Or use local installation (setup script handles this automatically)

**No enhanced logs found:**
- Install enhanced DesktopCommanderMCP: 
  ```bash
  npm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging
  ```
- Restart Claude Desktop after installation

**Empty or missing analysis:**
- Check log file exists: `~/.claude-server-commander/claude_tool_call.log`
- Verify recent activity has enhanced format (contains "session", "project" fields)
- Try longer time range: `"hours": 48`

### Debug Mode

```bash
# Enable verbose logging
DEBUG=recap:* node dist/index.js

# Test with sample data
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":168,"verbose":true}}}' | node dist/index.js
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**: Visit [https://github.com/ehukaimedia/recap](https://github.com/ehukaimedia/recap) and click "Fork"
2. **Clone your fork**: 
   ```bash
   git clone https://github.com/YOUR-USERNAME/recap.git
   cd recap
   ```
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes**: Follow the development guidelines below
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Submit your changes for review

### Development Guidelines

- Follow TypeScript strict mode
- Add tests for new functionality
- Update documentation for API changes
- Use conventional commit messages
- Ensure cross-platform compatibility

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- **[RecapMCP Repository](https://github.com/ehukaimedia/recap)** - This project's source code
- **[Enhanced DesktopCommanderMCP](https://github.com/ehukaimedia/DesktopCommanderMCP)** - Enhanced logging implementation
- **[Original DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP)** - Base tool implementation
- **[Model Context Protocol](https://github.com/modelcontextprotocol)** - MCP specification

## Changelog

### v1.0.0
- Initial release with MCP server implementation
- Session analysis and workflow pattern detection
- Cross-platform setup automation
- Claude Desktop integration
- TypeScript implementation with Zod validation

---

*Transform your development activity logs into intelligent productivity insights.* ✨
