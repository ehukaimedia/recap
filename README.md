# RecapMCP - Intelligent Work Recovery

> Just type `recap` and instantly know where you left off. No parameters, no confusion - just intelligent context recovery.

[![npm version](https://img.shields.io/npm/v/@ehukaimedia/recap-mcp.svg)](https://www.npmjs.com/package/@ehukaimedia/recap-mcp)
[![GitHub](https://img.shields.io/badge/GitHub-ehukaimedia%2Frecap-blue.svg)](https://github.com/ehukaimedia/recap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## What is RecapMCP?

RecapMCP is a Model Context Protocol (MCP) server that provides intelligent, context-aware recaps of your development work and universal script running capabilities. It analyzes your tool usage patterns and presents exactly what you need to resume work instantly, while also providing zero-configuration command execution for any project.

## ✨ The Magic: Zero Configuration

```bash
# Just type:
recap

# That's it. No parameters needed.
```

You'll instantly see:
- What you were doing (with confidence %)
- Where you left off
- Visual file activity heatmaps
- Specific commands to resume work
- Warnings about uncommitted changes

## 🎯 Key Features

### Intelligent Output
- **Adapts to your context** - Shows more detail for complex work, less for simple tasks
- **Time-aware** - Different output for "just left" vs "returning after lunch"
- **Multi-project aware** - Handles context switching between projects
- **Visual excellence** - Progress bars, heatmaps, and clear hierarchy

### Enhanced Tracking
- **Intent detection** - Knows if you're debugging, developing, or exploring
- **Operation chains** - Tracks multi-step workflows with progress
- **Search evolution** - Shows how your investigation progressed
- **File heatmaps** - Visual representation of file activity

### Always Actionable
- **Instant resume commands** - Copy and paste to continue
- **Smart git messages** - Based on detected intent
- **Next step suggestions** - Context-aware recommendations
- **Warning alerts** - For uncommitted files or untested changes

## 🚀 Universal Run Tool

RecapMCP includes a zero-configuration script runner that works seamlessly across platforms and languages:

### Features
- **Auto-detects project type** - Node.js, Python, or both
- **Cross-platform** - Works on Mac, Windows, and Linux
- **Smart command discovery** - Finds and categorizes all available commands
- **No setup required** - Just type `run` and it works

### Usage

```bash
# List available commands
run

# Execute a command
run build
run test --watch

# Specify project path (optional)
run {"command": "test", "projectPath": "/path/to/project"}
```

### Supported Languages

**Node.js Projects**
- Detects npm, yarn, or pnpm
- Discovers all package.json scripts
- Categorizes by purpose (dev, build, test, etc.)

**Python Projects**
- Detects pip, poetry, or pipenv
- Finds virtual environments
- Framework-specific commands (Django, Flask, FastAPI)

### Example Output

```
🚀 Available commands in my-project
📁 /Users/dev/my-project
🔧 Type: node
📦 Package managers: npm

🔨 DEV
  dev                  Start Next.js development server
  storybook           Start Storybook

🏗️ BUILD
  build               Build Next.js for production
  build:analyze       Build with bundle analyzer

🧪 TEST
  test                Run tests with Jest
  test:watch          Run tests in watch mode
  test:coverage       Generate coverage report

💡 Usage: run <command> [args...]
   Example: run build --watch
```

## Installation

### Prerequisites

RecapMCP requires the enhanced DesktopCommanderMCP fork with intelligent logging:

```bash
git clone https://github.com/ehukaimedia/DesktopCommanderMCP-Recap.git
cd DesktopCommanderMCP-Recap
npm install && npm run build
```

### Install RecapMCP

```bash
npm install -g @ehukaimedia/recap-mcp
```

### Configure Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "recap": {
      "command": "npx",
      "args": ["@ehukaimedia/recap-mcp"]
    }
  }
}
```

## Usage

### Recap Tool

In Claude, simply type:

```
recap
```

That's it! RecapMCP will analyze your recent activity and present an intelligent summary.

#### Optional: Specify Time Range

```
recap {"hours": 2}  // Last 2 hours (1-168 valid)
```

### Run Tool

Execute any project command without configuration:

```
run                    // List available commands
run build             // Execute build command
run test --watch      // Pass arguments naturally
```

## Example Output

```
⚠️ WORK CONTEXT • E-commerce API • 45m ago • 80%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 WHAT YOU WERE DOING
Debugging JWT authentication error (85% sure)

📍 WHERE YOU ARE NOW
Left off in /auth after editing middleware.js

🔍 INVESTIGATION TRAIL
"undefined" → "undefined token" → "jwt undefined" ✓

🔥 ACTIVE FILES
middleware.js    ████████ 8x (R:5 W:3) • Focus area
auth.test.js     ████     4x (R:4)     • Needs: test
jwt-utils.js     ██       2x (R:2)     • Reference

📝 RECENT CHANGES
middleware.js (45m ago)
+ Added null check validation (+87 chars)

⚠️ NEEDS ATTENTION
• 1 uncommitted file
• middleware.js edited but not tested

⚡ RESUME INSTANTLY
│ cd /Users/dev/ecommerce-api/src/auth
│ npm test middleware.test.js
│ git add middleware.js
│ git commit -m "fix: Add JWT null check validation"
```

## Why RecapMCP?

### The Problem
- Lost context when returning to work
- Time wasted remembering what you were doing
- Confusion with multiple format options
- Generic commit messages

### The Solution
- **Instant context recovery** - Know immediately where you left off
- **Zero decisions** - No parameters or formats to choose
- **Intelligent adaptation** - Output matches your needs
- **Actionable insights** - Copy commands and continue

## Advanced Features

### Multi-Project Intelligence
When working across multiple projects, RecapMCP automatically shows a project summary:

```
📊 MULTI-PROJECT ACTIVITY
E-commerce API   █████ 80m (2 sessions)
RecapMCP        ████  45m (1 session)
Documentation   ██    20m (1 session)
```

### Time-Aware Adaptation
- **Just left** (< 10 min): Minimal output for quick resume
- **Recent** (10-60 min): Balanced context with key details
- **Returning** (> 1 hour): Full context recovery with all details

### Intent Detection
RecapMCP understands what you're trying to do:
- **Debugging**: Shows investigation trail and error context
- **Development**: Displays progress and next implementation steps
- **Exploration**: Maps what you've discovered
- **Maintenance**: Lists all refactoring changes

## Requirements

- Node.js 18+
- Claude Desktop
- DesktopCommanderMCP-Recap (enhanced fork)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [ehukaimedia](https://github.com/ehukaimedia)

---

**Built with ❤️ for developers who value simplicity and intelligence**