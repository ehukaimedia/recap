# RecapMCP Implementation Plan - FINALIZED

## 🎯 Project Vision

Create a professional single-tool MCP server that provides intelligent contextual recaps of DesktopCommanderMCP usage. This transforms the recap functionality from an external CLI tool into a native MCP tool that Claude can use directly via the `recap` command.

## ✅ Current Status & Foundation

### 🚀 **Completed Prerequisites**
- ✅ **Enhanced DesktopCommanderMCP logging** → Successfully implemented and globally installed
- ✅ **Contextual data capture** → Session tracking, workflow patterns, project detection working
- ✅ **GitHub fork deployed** → `https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging`
- ✅ **Cross-platform compatibility** → Verified Mac/PC/Linux support
- ✅ **Production testing** → Enhanced logging generating rich contextual data

### 📊 **Enhanced Log Format (Our Foundation)**
```json
2025-06-22T20:42:38.692Z | list_directory | {"session":"mc84wf6s_u7w54r","sessionAge":"0m","newSession":true,"project":"Recap","workflow":"EXPLORATION","files":["README.md"]} | Args: {"path":"..."}
```

## 🏗️ Architecture Overview

### Simplified Single-Tool MCP Server
```
RecapMCP/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── server.ts             # Server setup and tool registration  
│   ├── recap.ts              # All-in-one recap functionality
│   └── types.ts              # TypeScript definitions
├── dist/                     # Compiled JavaScript
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Documentation
```

**Simplified from original plan** → Single `recap.ts` file instead of multiple modules for faster development.

## 🔧 Technical Implementation

### 1. MCP Server Foundation

**Entry Point (`src/index.ts`):**
```typescript
#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RecapMCP server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Server Setup (`src/server.ts`):**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { RecapArgsSchema, handleRecap } from './recap.js';

export const server = new Server({
  name: "recap-mcp",
  version: "1.0.0",
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "recap",
    description: "Generate intelligent contextual recap from DesktopCommanderMCP enhanced logs. Analyzes session patterns, workflow detection, and project context.",
    inputSchema: zodToJsonSchema(RecapArgsSchema),
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  
  if (name === "recap") {
    return await handleRecap(args);
  }
  
  throw new Error(`Unknown tool: ${name}`);
});
```

### 2. All-In-One Recap Implementation

**Complete Functionality (`src/recap.ts`):**
```typescript
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const RecapArgsSchema = z.object({
  hours: z.number().min(1).max(168).default(24).describe("Hours of activity to analyze (1-168, default: 24)"),
  verbose: z.boolean().default(false).describe("Include detailed session breakdown"),
  format: z.enum(['text', 'json']).default('text').describe("Output format")
});

export type RecapArgs = z.infer<typeof RecapArgsSchema>;

// Log file locations to search
const DEFAULT_LOG_PATHS = [
  path.join(os.homedir(), '.claude-server-commander', 'claude_tool_call.log'),
  '/.claude-server-commander/claude_tool_call.log'
];

interface EnhancedToolCall {
  timestamp: Date;
  toolName: string;
  contextInfo?: {
    session: string;
    sessionAge: string;
    newSession?: boolean;
    project?: string;
    workflow?: string;
    sequence?: string;
    files?: string[];
  };
}

interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  primaryProject?: string;
  workflowPatterns: string[];
  filesAccessed: string[];
  toolCalls: EnhancedToolCall[];
}

export async function handleRecap(args: RecapArgs) {
  try {
    // Find log file
    const logPath = await findLogFile();
    
    // Parse enhanced logs
    const toolCalls = await parseEnhancedLogs(logPath, args.hours);
    
    if (toolCalls.length === 0) {
      return {
        content: [{
          type: "text",
          text: `📭 No enhanced DesktopCommanderMCP activity found in the last ${args.hours} hours.\n\nMake sure enhanced contextual logging is installed and active:\nsudo npm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging`
        }]
      };
    }
    
    // Analyze sessions
    const sessions = analyzeSessions(toolCalls);
    
    // Generate output
    const content = args.format === 'json' 
      ? JSON.stringify(generateAnalysis(sessions), null, 2)
      : generateTextRecap(sessions, args.verbose);
    
    return {
      content: [{
        type: "text",
        text: content
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: "text", 
        text: `❌ Error generating recap: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

async function findLogFile(): Promise<string> {
  for (const logPath of DEFAULT_LOG_PATHS) {
    try {
      await fs.promises.access(logPath);
      return logPath;
    } catch {
      continue;
    }
  }
  throw new Error('DesktopCommanderMCP log file not found. Searched: ' + DEFAULT_LOG_PATHS.join(', '));
}

async function parseEnhancedLogs(logPath: string, hours: number): Promise<EnhancedToolCall[]> {
  const content = await fs.promises.readFile(logPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const calls: EnhancedToolCall[] = [];
  
  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed && parsed.timestamp >= cutoffTime && parsed.contextInfo) {
      calls.push(parsed);
    }
  }
  
  return calls;
}

function parseLogLine(line: string): EnhancedToolCall | null {
  try {
    const parts = line.split(' | ');
    if (parts.length < 3) return null;
    
    const timestamp = new Date(parts[0]);
    const toolName = parts[1].trim();
    
    let contextInfo;
    try {
      contextInfo = JSON.parse(parts[2]);
    } catch {
      return null; // Skip entries without enhanced context
    }
    
    return { timestamp, toolName, contextInfo };
  } catch {
    return null;
  }
}

function analyzeSessions(toolCalls: EnhancedToolCall[]): Session[] {
  const sessionMap = new Map<string, Session>();
  
  for (const call of toolCalls) {
    if (!call.contextInfo?.session) continue;
    
    const sessionId = call.contextInfo.session;
    
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        id: sessionId,
        startTime: call.timestamp,
        endTime: call.timestamp,
        duration: 0,
        workflowPatterns: [],
        filesAccessed: [],
        toolCalls: [call]
      });
    } else {
      const session = sessionMap.get(sessionId)!;
      session.toolCalls.push(call);
      session.endTime = call.timestamp;
    }
  }
  
  // Finalize sessions
  const sessions = Array.from(sessionMap.values());
  for (const session of sessions) {
    finalizeSession(session);
  }
  
  return sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

function finalizeSession(session: Session): void {
  session.duration = Math.round(
    (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
  );
  
  const patterns = new Set<string>();
  const projectCounts: Record<string, number> = {};
  const files = new Set<string>();
  
  for (const call of session.toolCalls) {
    if (call.contextInfo?.workflow) {
      patterns.add(call.contextInfo.workflow);
    }
    
    if (call.contextInfo?.project) {
      projectCounts[call.contextInfo.project] = 
        (projectCounts[call.contextInfo.project] || 0) + 1;
    }
    
    if (call.contextInfo?.files) {
      call.contextInfo.files.forEach(f => files.add(f));
    }
  }
  
  session.workflowPatterns = Array.from(patterns);
  session.filesAccessed = Array.from(files);
  
  if (Object.keys(projectCounts).length > 0) {
    session.primaryProject = Object.entries(projectCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
}

function generateTextRecap(sessions: Session[], verbose: boolean): string {
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalCalls = sessions.reduce((sum, s) => sum + s.toolCalls.length, 0);
  
  let output = '\n🔄 CONTEXTUAL RECAP\n';
  output += '═'.repeat(50) + '\n';
  
  if (sessions.length > 0) {
    const startTime = sessions[0].startTime.toLocaleString();
    const endTime = formatTimeAgo(sessions[sessions.length - 1].endTime);
    output += `📅 Time Range: ${startTime} → ${endTime}\n`;
    output += `⚡ Activity: ${totalCalls} tool calls across ${sessions.length} session${sessions.length === 1 ? '' : 's'}\n`;
  }
  
  // Recent sessions
  const recentSessions = sessions.slice(-3);
  if (recentSessions.length > 0) {
    output += '\n📊 RECENT SESSIONS\n';
    for (const session of recentSessions) {
      const timeAgo = formatTimeAgo(session.startTime);
      output += `\n**Session ${session.id.slice(-6)}** (${session.duration}m) - ${timeAgo}\n`;
      output += `  Project: ${session.primaryProject || 'Mixed'}\n`;
      output += `  Workflows: ${session.workflowPatterns.join(', ') || 'None detected'}\n`;
      output += `  Files: ${session.filesAccessed.slice(0, 3).join(', ')}${session.filesAccessed.length > 3 ? '...' : ''}\n`;
      output += `  Operations: ${session.toolCalls.length} tools\n`;
    }
  }
  
  // Overall narrative
  output += '\n🎯 NARRATIVE SUMMARY\n';
  output += generateNarrative(sessions);
  
  if (verbose && sessions.length > 0) {
    output += '\n\n🔧 WORKFLOW ANALYSIS\n';
    const workflowCounts: Record<string, number> = {};
    sessions.forEach(session => {
      session.workflowPatterns.forEach(pattern => {
        workflowCounts[pattern] = (workflowCounts[pattern] || 0) + 1;
      });
    });
    
    Object.entries(workflowCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([workflow, count]) => {
        output += `• ${workflow}: ${count} occurrence${count === 1 ? '' : 's'}\n`;
      });
  }
  
  output += '\n✨ Enhanced contextual logging active and working!\n';
  
  return output;
}

function generateNarrative(sessions: Session[]): string {
  if (sessions.length === 0) return 'No activity found.';
  
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalCalls = sessions.reduce((sum, s) => sum + s.toolCalls.length, 0);
  
  const projectCounts: Record<string, number> = {};
  sessions.forEach(session => {
    if (session.primaryProject) {
      projectCounts[session.primaryProject] = 
        (projectCounts[session.primaryProject] || 0) + 1;
    }
  });
  
  const primaryProject = Object.entries(projectCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  const workflowCounts: Record<string, number> = {};
  sessions.forEach(session => {
    session.workflowPatterns.forEach(pattern => {
      workflowCounts[pattern] = (workflowCounts[pattern] || 0) + 1;
    });
  });
  
  const primaryWorkflow = Object.entries(workflowCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  const allFiles = new Set<string>();
  sessions.forEach(session => {
    session.filesAccessed.forEach(file => allFiles.add(file));
  });
  
  let narrative = `Worked for ${totalDuration} minutes across ${sessions.length} session${sessions.length === 1 ? '' : 's'}. `;
  
  if (primaryProject) {
    narrative += `Primary focus: ${primaryProject} project. `;
  }
  
  if (primaryWorkflow) {
    narrative += `Main activity: ${primaryWorkflow} workflow. `;
  }
  
  if (allFiles.size > 0) {
    narrative += `Touched ${allFiles.size} file${allFiles.size === 1 ? '' : 's'}. `;
  }
  
  narrative += `Total operations: ${totalCalls}.`;
  
  return narrative;
}

function generateAnalysis(sessions: Session[]) {
  return {
    summary: {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      totalOperations: sessions.reduce((sum, s) => sum + s.toolCalls.length, 0)
    },
    sessions: sessions.map(session => ({
      id: session.id,
      startTime: session.startTime.toISOString(),
      duration: session.duration,
      primaryProject: session.primaryProject,
      workflowPatterns: session.workflowPatterns,
      filesAccessed: session.filesAccessed,
      operationCount: session.toolCalls.length
    }))
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${diffHours}h ago`;
}
```

## 📦 Finalized Package Configuration

**Package.json:**
```json
{
  "name": "@ehukaimedia/recap-mcp", 
  "version": "1.0.0",
  "description": "MCP server providing intelligent contextual recaps of DesktopCommanderMCP enhanced logs",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "recap-mcp": "dist/index.js"
  },
  "files": [
    "dist/",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch",
    "test": "node dist/index.js",
    "prepare": "npm run build"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.8.0",
    "zod": "^3.24.1",
    "zod-to-json-schema": "^3.23.5"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.17.0"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "desktop-commander",
    "contextual-recap",
    "claude",
    "productivity"
  ],
  "author": "ehukaimedia",
  "license": "MIT"
}
```

**TypeScript Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

## 🔗 Claude Desktop Integration

**Configuration (`claude_desktop_config.json`):**
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

**Installation Path:**
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## 🚀 Usage Examples (Updated)

### Seamless Integration:
```
User: "Can you give me a recap of my recent work?"

Claude: I'll analyze your recent DesktopCommanderMCP activity to provide a contextual recap.

[Uses recap tool automatically]

🔄 CONTEXTUAL RECAP
═══════════════════════════════════════════════════
📅 Time Range: 6/22/2025, 8:42:38 PM → 2m ago
⚡ Activity: 15 tool calls across 2 sessions

📊 RECENT SESSIONS

**Session u7w54r** (8m) - 1h ago
  Project: DesktopCommanderMCP-Recap
  Workflows: SETUP, EDITING
  Files: trackTools.ts, README.md
  Operations: 8 tools

🎯 NARRATIVE SUMMARY
Worked for 25 minutes across 2 sessions. Primary focus: Recap project. 
Main activity: SETUP workflow. Touched 5 files. Total operations: 15.

✨ Enhanced contextual logging active and working!
```

### Advanced Usage:
```
User: "Show me detailed activity from the last 8 hours with verbose output"
Claude: [Uses recap tool with hours=8, verbose=true]

User: "Export my activity data as JSON"
Claude: [Uses recap tool with format=json]
```

## 📋 Implementation Phases - UPDATED

### Phase 1: Core Implementation (Week 1) ✅ READY
- [x] **Foundation established** → Enhanced logging working and deployed
- [ ] Create RecapMCP project structure  
- [ ] Implement MCP server with single recap tool
- [ ] Test basic functionality and Claude Desktop integration
- [ ] Verify enhanced log parsing

### Phase 2: Polish & Testing (Week 2)
- [ ] Add robust error handling and edge cases
- [ ] Optimize performance for large log files
- [ ] Add comprehensive testing scenarios
- [ ] Create documentation and examples

### Phase 3: Deploy & Distribute (Week 3)
- [ ] Package for npm distribution
- [ ] Create installation guide
- [ ] Test cross-platform compatibility
- [ ] Consider contributing back to community

## 🔧 Simplified Development Workflow

### Setup & Build
```bash
# Create project directory
mkdir RecapMCP && cd RecapMCP

# Initialize project
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk zod zod-to-json-schema
npm install -D typescript @types/node

# Create source files (as specified above)
# Build and test
npm run build
```

### Testing Protocol
```bash
# Test MCP server responds
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Test recap tool functionality  
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"recap","arguments":{"hours":24}}}' | node dist/index.js

# Test with Claude Desktop integration
# Add to claude_desktop_config.json and restart Claude
```

## 🎉 Updated Success Criteria

### Functional Requirements
- [ ] MCP server starts without errors
- [ ] `recap` tool appears in Claude's available tools list
- [ ] Successfully parses enhanced DesktopCommanderMCP logs
- [ ] Generates meaningful contextual summaries with session analysis
- [ ] Handles time range filtering and output format options
- [ ] Gracefully handles missing or old-format logs

### Quality Requirements  
- [ ] Robust error handling with clear, helpful messages
- [ ] Performance acceptable for log files up to 50MB
- [ ] Type-safe implementation with comprehensive schemas
- [ ] Professional output formatting matching examples
- [ ] Cross-platform compatibility (Mac/Windows/Linux)

### Integration Requirements
- [ ] Seamless Claude Desktop integration
- [ ] Follows MCP SDK best practices
- [ ] Compatible with enhanced DesktopCommanderMCP v0.2.3+
- [ ] Easy installation via npm
- [ ] Clear configuration documentation

## 🎯 Benefits Realized

### ✅ **Seamless User Experience**
**Before**: "Can you run the recap command?" → Copy/paste terminal commands
**After**: "Give me a recap" → Claude uses tool automatically

### ✅ **Professional Implementation**  
- **Native MCP tool** following established patterns
- **Type-safe** with Zod schemas and TypeScript
- **Proper error handling** with informative messages
- **Performance optimized** for real-world log sizes

### ✅ **Intelligent Analysis**
- **Session detection** using enhanced log data
- **Workflow pattern recognition** (SETUP, EDITING, DEBUGGING, etc.)
- **Project context extraction** from working directories
- **Narrative generation** for human-readable insights

## 💡 Key Design Decisions - FINALIZED

### Single-File Approach
**Decision**: Combine all functionality in `recap.ts` instead of multiple modules
**Rationale**: Faster development, easier maintenance, simpler deployment

### Enhanced Log Dependency
**Decision**: Only parse enhanced format, skip old entries
**Rationale**: Provides much richer insights, encourages enhanced logging adoption

### Minimal Dependencies
**Decision**: Only MCP SDK, Zod, and Node.js built-ins
**Rationale**: Faster installation, fewer security concerns, better reliability

### Text-First Output
**Decision**: Default to formatted text, JSON as option
**Rationale**: Better Claude conversation integration, human-readable by default

## 🔮 Future Enhancement Opportunities

### Advanced Analysis
- **Custom time ranges** ("Show me last Tuesday's work")
- **Project comparison** ("Compare my productivity on different projects")
- **Workflow optimization** ("When am I most productive?")
- **Team collaboration** (multi-user log analysis)

### Integration Expansion
- **Calendar correlation** (meeting vs coding time)
- **Project management** (link to tickets/issues)
- **Productivity dashboards** (web interface)
- **Export integrations** (Slack, email reports)

---

## 🎯 FINAL IMPLEMENTATION STATUS

**✅ FOUNDATION COMPLETE**: Enhanced DesktopCommanderMCP logging working perfectly
**🔧 NEXT STEP**: Implement RecapMCP server following this finalized plan
**📅 TIMELINE**: 2-3 weeks to full deployment
**🎉 OUTCOME**: Professional MCP tool providing intelligent contextual recaps

**This plan transforms the recap functionality from an external CLI tool into a native MCP tool that Claude can use seamlessly, providing a dramatically improved user experience while leveraging the enhanced logging foundation we've already built.** 🚀