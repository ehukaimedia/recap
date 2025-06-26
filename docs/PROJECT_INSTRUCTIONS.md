# Claude Project Instructions: RecapMCP

You are working on RecapMCP, an intelligent MCP (Model Context Protocol) server that provides contextual recaps and intent detection from DesktopCommanderMCP activity logs.

## Project Location
`/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap`

## Critical Rules - READ FIRST

### Development Rules
1. **TEST FIRST** - No code without failing test (TDD)
2. **100% COVERAGE** - All new code must have tests
3. **NO HARDCODING** - Use config files and env variables
4. **CHUNK WORK** - Complete tasks in 30-minute segments
5. **COMMIT OFTEN** - After each passing test
6. **NO GIT PUSH** - Never push without explicit permission

### File Management Rules
1. **NO scattered documentation** - All docs go in `/docs` folder only
2. **NO "enhanced/improved/updated" in any names** - Use descriptive names
3. **NO version numbers in filenames** - Use git for versioning
4. **ALWAYS check file structure first** - Use list_directory before creating
5. **ALWAYS follow naming conventions** - camelCase.ts, PascalCase.tsx
6. **HANDOFFS as ARTIFACTS** - Create session handoffs as Claude artifacts, not files

## CRITICAL: DesktopCommanderMCP-Recap Integration

### ⚠️ MANDATORY UNDERSTANDING
RecapMCP's intent detection **requires** the enhanced DesktopCommanderMCP fork that includes the intelligent logging engine located at:
`/Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap/src/utils/trackTools.ts`

### 🔴 STRICT RULES:
1. **MUST understand data flow** through trackTools.ts via the MCP tools
2. **ONLY allowed to modify**: `/DesktopCommanderMCP-Recap/src/utils/trackTools.ts`
3. **READ-ONLY access**: ALL other files in DesktopCommanderMCP-Recap are for research only
4. **DO NOT ALTER**: Any file except trackTools.ts in the DesktopCommanderMCP-Recap codebase

### Understanding the Data Flow:
- Study how trackTools.ts processes tool calls
- Understand the intent detection algorithms
- Learn how context is captured and logged
- Analyze the enhanced log format structure
- Review how MCP tools interact with the logging system

### ⚠️ CRITICAL BUILD STEPS:
After ANY changes to trackTools.ts or Recap's MCP tools:
1. **Build DesktopCommanderMCP-Recap**: 
   ```bash
   cd /Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap
   npm run build
   ```
2. **Build RecapMCP**:
   ```bash
   cd /Users/ehukaimedia/Desktop/AI-Applications/Node/Recap
   npm run build
   ```
3. **RESTART Claude Desktop** - Changes won't take effect until restart!

**Violation of these rules will break the integration between RecapMCP and DesktopCommanderMCP-Recap!**

## Test-Driven Development Workflow

### For EVERY Feature:
1. Write failing test
2. Run test (see RED)
3. Write minimal code
4. Run test (see GREEN)
5. Refactor if needed
6. Commit: `git commit -m "test: add [feature] test"`
7. Update handoff artifact in Claude

### Example TDD Cycle:
```bash
# 1. Write test
echo "describe('IntentDetector', () => { ... })" > test/intentDetector.test.ts

# 2. Run test - should FAIL
npm test

# 3. Implement feature
echo "export class IntentDetector { ... }" > src/intentDetector.ts

# 4. Run test - should PASS
npm test

# 5. Commit
git add -A
git commit -m "test: add intent detector base tests"
```## Session Management

### Starting a Session:
1. **Check for previous handoff artifact** in Claude conversation
2. Check git status and branch
3. Run tests to see current state
4. Continue from "Next Steps" in handoff artifact

### During Session:
1. Work in 30-minute chunks
2. Test → Code → Commit cycle
3. Create/Update handoff artifact after each chunk
4. Never leave failing tests
5. Use meaningful commit messages

### Ending a Session:
1. Ensure all tests pass
2. Commit all changes
3. Push to remote
4. **Create handoff as Claude artifact** with:
   - What was completed
   - Current test status
   - Next steps with details
   - Any blockers or questions

### Handoff Artifact Format:
Create handoffs as Claude artifacts (not files) using the format:
- Title: "RecapMCP Session Handoff - [DATE]"
- Type: Markdown
- Include all context needed for next session

## Project Overview

**RecapMCP** is an intelligent productivity analysis tool that:
- Analyzes DesktopCommanderMCP activity logs
- Detects developer intent and work patterns
- Provides contextual recaps and insights
- Supports recovery mode for interrupted sessions
- Offers multiple output formats (text, json, handoff, recovery)

### Key Technologies:
- TypeScript (strict mode)
- Model Context Protocol (MCP) SDK
- Zod for runtime validation
- Node.js 18+ (ESM modules)

## Development Environment

### Prerequisites:
- Node.js 18+ 
- TypeScript 5.3+
- Enhanced DesktopCommanderMCP-Recap (REQUIRED for intent detection)
  - Location: `/Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap/`
  - Critical file: `src/utils/trackTools.ts` (contains intelligent logging engine)
  - Installation: Must be built and configured in Claude Desktop
### Development Setup:
```bash
# Clone repository
git clone https://github.com/ehukaimedia/recap.git
cd recap

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Available Scripts:
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm test` - Run all tests
- `npm run test:server` - Test MCP server functionality
- `npm run test:functionality` - Test recap functionality
- `npm run setup` - Install and configure
- `npm run lint` - TypeScript compilation serves as linting
- `npm run validate` - Build and test

## Project Structure
```
Recap/
├── src/                     # TypeScript source files
│   ├── index.ts            # MCP server entry point
│   ├── server.ts           # Server setup and tool registration
│   ├── recap.ts            # Core analysis logic
│   ├── recovery.ts         # Recovery mode implementation
│   ├── types.ts            # TypeScript interfaces
│   └── custom-stdio.ts     # Custom stdio handling
├── test/                    # Test files
│   ├── recap.test.ts       # Recap functionality tests
│   ├── recovery.test.ts    # Recovery mode tests
│   └── intent.test.ts      # Intent detection tests
├── docs/                    # All documentation
│   ├── PROJECT_INSTRUCTIONS.md # This file - Developer guide
│   ├── KNOWN_ISSUES.md     # Common problems and solutions
│   ├── CHANGELOG.md        # Version history
│   ├── ROADMAP.md          # Future plans
│   ├── HANDOFF.md          # Legacy handoff (use artifacts now)
│   └── API.md              # API documentation
├── scripts/                 # Setup and utility scripts
│   ├── setup.mjs           # Cross-platform setup
│   ├── setup.sh            # Mac/Linux setup
│   └── setup.bat           # Windows setup
├── dist/                    # Compiled JavaScript (gitignored)
├── backup/                  # Backup files (gitignored)
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── .gitignore              # Git ignore rules
└── README.md               # Public documentation
```

**Note**: Session handoffs are created as Claude artifacts, not files. The HANDOFF.md file is legacy.
## Configuration Management

### Environment Variables:
```typescript
// ❌ NEVER hardcode values
const LOG_PATH = "~/.claude-server-commander/claude_tool_call.log";
const TIMEOUT = 30000;

// ✅ ALWAYS use configuration
const config = {
  LOG_PATH: process.env.RECAP_LOG_PATH || 
    path.join(os.homedir(), '.claude-server-commander', 'claude_tool_call.log'),
  TIMEOUT: parseInt(process.env.RECAP_TIMEOUT) || 30000,
  MAX_SESSIONS: parseInt(process.env.RECAP_MAX_SESSIONS) || 50
};
```

### Configuration Files:
- **package.json** - Project metadata and scripts
- **tsconfig.json** - TypeScript compiler options
- **.env** - Local environment variables (never commit)
- **claude_desktop_config.json** - Claude Desktop integration

## Common Development Tasks

### Adding a New Feature:
1. Write test first in `test/` directory
2. Run test to see it fail
3. Implement feature in `src/`
4. Run test to see it pass
5. Refactor if needed
6. Update documentation
7. Commit with descriptive message

### Modifying Intent Detection:
1. Write test for new pattern
2. Update types in `src/types.ts`
3. Modify detection logic in `src/recap.ts`
4. Test with sample logs
5. Update API documentation
6. Add example to README
7. **Build & Restart**:
   ```bash
   npm run build
   # Then restart Claude Desktop to test changes live
   ```

### Modifying trackTools.ts:
1. Navigate to DesktopCommanderMCP-Recap:
   ```bash
   cd /Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap
   ```
2. Edit ONLY `src/utils/trackTools.ts`
3. Build the changes:
   ```bash
   npm run build
   ```
4. Build RecapMCP if needed:
   ```bash
   cd ../Recap
   npm run build
   ```
5. **RESTART Claude Desktop** - Required for changes to take effect!

### Adding New Output Format:
1. Write test for format structure
2. Add format type to Zod schema
3. Implement formatter in `src/recap.ts`
4. Test with various inputs
5. Document in API.md
6. Update README examples
## Git Workflow

### Commit Message Format:
```bash
# Types: test, feat, fix, docs, style, refactor, perf, chore
git commit -m "type: description"

# Examples:
git commit -m "test: add recovery mode validation tests"
git commit -m "feat: implement confidence scoring algorithm"
git commit -m "fix: handle empty log file gracefully"
git commit -m "docs: update API documentation for v2.1"
git commit -m "refactor: extract intent detection to separate module"
```

### 🔴 CRITICAL: Git Push Permission Rule
**NEVER execute `git push` without explicit user permission!**

**Allowed Git Operations (No Permission Needed):**
- ✅ `git add` - Stage changes
- ✅ `git commit` - Commit locally
- ✅ `git status` - Check status
- ✅ `git log` - View history
- ✅ `git branch` - Manage branches
- ✅ `git checkout` - Switch branches
- ✅ `git merge` - Merge branches
- ✅ `git diff` - View differences

**Requires Explicit Permission:**
- ❌ `git push` - ALWAYS ask before pushing to remote
- ❌ `git push --force` - NEVER use without permission
- ❌ `git push origin [branch]` - ALWAYS ask first

### Branch Strategy:
- `main` - Stable, production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

## Testing Guidelines

### Test Structure:
```typescript
describe('RecapAnalyzer', () => {
  describe('parseLogEntry', () => {
    it('should parse valid enhanced log format', () => {
      // Arrange
      const logEntry = createMockLogEntry();
      
      // Act
      const result = analyzer.parseLogEntry(logEntry);
      
      // Assert
      expect(result).toHaveProperty('intent');
      expect(result.intentConfidence).toBeGreaterThan(0);
    });
  });
});
```

### Test Coverage Requirements:
- New features: 100% coverage
- Bug fixes: Include regression tests
- Refactoring: Maintain existing coverage
- Run coverage: `npm run test -- --coverage`

## Known Issues and Solutions

### Common Problems:
1. **Empty recap results**
   - Check log file exists and has recent entries
   - Verify enhanced DesktopCommanderMCP is installed
   - Try longer time range

2. **Low confidence scores**
   - Intent detection needs 2+ tool calls
   - Ensure varied tool usage for pattern detection
   - Check log format includes intent fields

3. **Claude doesn't see tool**
   - Restart Claude Desktop
   - Verify config path is absolute
   - Check server starts without errors

4. **Changes not taking effect**
   - Did you run `npm run build` in BOTH projects?
   - Did you restart Claude Desktop?
   - Build order: DesktopCommanderMCP-Recap first, then Recap
   - Remember: Claude caches MCP servers, restart is required!

## Workflow Checklist

### Before Starting Task:
- [ ] Check for handoff artifact in Claude conversation
- [ ] Pull latest changes
- [ ] Run all tests
- [ ] Check ROADMAP.md for priorities
- [ ] Create feature branch

### During Development:
- [ ] Write test first (TDD)
- [ ] See test fail
- [ ] Write minimal code
- [ ] See test pass
- [ ] Refactor if needed
- [ ] Commit with clear message
- [ ] Update documentation

### Before Ending Session:
- [ ] All tests passing
- [ ] Code committed
- [ ] Ask permission to push (NEVER push without permission)
- [ ] Create handoff artifact in Claude
- [ ] No incomplete work

## Quick Reference

### Documentation Guidelines:
- **All docs in `/docs/`**: No documentation outside this folder
- **Session handoffs**: Create as Claude artifacts (not files)
- **Project docs**: PROJECT_INSTRUCTIONS.md, ROADMAP.md, etc. in `/docs/`
- **No scattered files**: Keep root directory clean
- **Legacy HANDOFF.md**: Exists for reference but use artifacts

### File Locations:
- **Source code**: `/src/*.ts`
- **Tests**: `/test/*.test.ts`
- **Documentation**: `/docs/*.md`
- **Scripts**: `/scripts/*`
- **Logs**: `~/.claude-server-commander/`

### Important Commands:
```bash
# Development
npm run dev          # Watch mode
npm test            # Run tests
npm run build       # Compile TS

# Setup
npm run setup       # Full setup
npm run setup:mac   # Mac setup
npm run setup:windows # Windows setup

# Testing
npm run test:server # Test MCP server
npm run test:functionality # Test recap tool

# CRITICAL: After ANY MCP changes
cd /Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap
npm run build
cd ../Recap
npm run build
# RESTART Claude Desktop!
```

### Environment Variables:
- `RECAP_LOG_PATH` - Custom log location
- `RECAP_MAX_SESSIONS` - Max sessions to analyze
- `RECAP_TIMEOUT` - Analysis timeout (ms)

Remember: Quality through testing, continuity through documentation, progress through small commits.