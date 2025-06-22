# RecapMCP - Intelligent Activity Recaps 🔄

Transform your DesktopCommanderMCP tool logs into intelligent contextual insights with native Claude integration.

## 🚀 Quick Start

### 🎯 **One-Command Setup (Recommended)**

**For Mac/Linux:**
```bash
./setup.sh
```

**For Windows:**
```cmd
setup.bat
```

**Or using npm:**
```bash
npm install
npm run setup
```

That's it! The setup script will:
- ✅ Build the RecapMCP server
- ✅ Install it globally 
- ✅ Configure Claude Desktop automatically
- ✅ Test the installation
- ✅ Check for enhanced DesktopCommanderMCP

Then just restart Claude Desktop and ask: *"Give me a recap"*

### 🔧 **Manual Setup (If Needed)**
### 🔧 **Manual Setup (If Needed)**

#### 1. Prerequisites
Make sure you have enhanced DesktopCommanderMCP logging installed:
```bash
sudo npm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging
```

#### 2. Build RecapMCP
```bash
npm install
npm run build
```

#### 3. Test the Server
```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Test recap functionality  
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":24}}}' | node dist/index.js
```

#### 4. Add to Claude Desktop (Manual)

Add this to your Claude Desktop configuration:

**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

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

Then restart Claude Desktop.

## 🎯 Usage

Once integrated, simply ask Claude:

```
"Can you give me a recap of my recent work?"
"Show me what I worked on today"
"Give me a detailed recap of the last 8 hours"
```

Claude will automatically use the `recap` tool and provide intelligent contextual summaries like:

```
🔄 CONTEXTUAL RECAP
════════════════════════════════════════
📅 Time Range: Today, 9:00 AM → 2m ago
⚡ Activity: 23 tool calls across 2 sessions

📊 RECENT SESSIONS

**Session abc123** (45m) - 2h ago
  Project: E-commerce API
  Workflows: SETUP, EDITING, TESTING  
  Files: server.js, auth.middleware.js
  Operations: 15 tools

🎯 NARRATIVE SUMMARY
Worked for 57 minutes across 2 sessions. Primary focus: 
E-commerce API project. Main activity: SETUP→EDITING→TESTING 
workflow. Touched 8 files. Total operations: 23.
```

## 🔧 Features

- **Session Detection**: Automatic work session boundaries
- **Project Context**: Identifies projects from working directories
- **Workflow Patterns**: Recognizes EXPLORATION, EDITING, DEBUGGING, SETUP, ANALYSIS patterns
- **File Tracking**: Shows which files were accessed and modified
- **Time Analysis**: Duration tracking and productivity insights
- **Flexible Output**: Text summaries or JSON data
- **Claude Integration**: Native tool that Claude can use automatically

## 📊 Tool Options

The `recap` tool supports these parameters:

- `hours` (1-168, default: 24): Time range to analyze
- `verbose` (boolean, default: false): Include detailed breakdown
- `format` ("text" | "json", default: "text"): Output format

## 🎉 What Makes This Special

**Before**: "You used 50 tools today" (meaningless)
**After**: "Worked on Authentication project for 45 minutes using DEBUGGING workflow, modified 3 config files, followed debug→analyze→fix pattern" (meaningful insights)

The enhanced logging captures rich contextual information that enables intelligent analysis instead of basic tool counting.

## 🔗 Related

- **Enhanced DesktopCommanderMCP**: https://github.com/ehukaimedia/DesktopCommanderMCP
- **Original DesktopCommanderMCP**: https://github.com/wonderwhy-er/DesktopCommanderMCP
- **Model Context Protocol**: https://github.com/modelcontextprotocol

---

*Transforming tool usage statistics into intelligent workflow narratives.* ✨
