# Known Issues - RecapMCP

## CRITICAL: DesktopCommanderMCP-Recap Integration

### ⚠️ READ FIRST - Integration Requirements
**Issue**: RecapMCP REQUIRES the enhanced DesktopCommanderMCP-Recap fork for intent detection.

**Critical Rules**:
1. **Location**: `/Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap/`
2. **Modifiable File**: ONLY `src/utils/trackTools.ts` can be modified
3. **Read-Only**: ALL other files in DesktopCommanderMCP-Recap are for research only
4. **Data Flow**: Must understand how data flows through trackTools.ts

**Build Requirements**:
After ANY changes to trackTools.ts or Recap's MCP tools:
```bash
# 1. Build DesktopCommanderMCP-Recap
cd /Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap
npm run build

# 2. Build RecapMCP
cd ../Recap
npm run build

# 3. RESTART Claude Desktop - Required!
```

**Consequences of Not Building/Restarting**:
- Changes won't take effect
- Old code will continue running
- Debugging becomes impossible
- Intent detection may fail

## Installation Issues

### 1. Claude Desktop Config Path
**Issue**: Claude doesn't recognize the recap tool after installation.

**Solution**:
- Use absolute paths in claude_desktop_config.json
- Restart Claude Desktop after configuration changes
- Verify paths don't contain spaces or special characters

**Example Fix**:
```json
{
  "mcpServers": {
    "recap": {
      "command": "node",
      "args": ["/Users/username/recap/dist/index.js"]
    }
  }
}
```

### 2. Missing Enhanced Logs
**Issue**: Recap shows no intent detection or returns empty results.

**Solution**:
- Install enhanced DesktopCommanderMCP-Recap fork (not original)
- Verify log file contains enhanced format with intent fields
- Check log file permissions

**Verification**:
```bash
# Check if log exists
ls -la ~/.claude-server-commander/claude_tool_call.log

# Verify enhanced format
tail -n 20 ~/.claude-server-commander/claude_tool_call.log | grep "intent"
```
## Runtime Issues

### 3. Low Confidence Scores
**Issue**: Intent detection shows very low confidence (25-30%) consistently.

**Solution**:
- Intent detection requires minimum 2 tool calls
- Ensure varied tool usage (not just read_file)
- Work sessions should be >5 minutes for meaningful patterns

**Tips**:
- Use different tools: search_code, edit_block, create_directory
- Longer sessions provide better pattern detection
- Check that enhanced logging is capturing all tool calls

### 4. Timeout Errors
**Issue**: Recap times out on large log files.

**Solution**:
```bash
# Set custom timeout (milliseconds)
export RECAP_TIMEOUT=60000  # 60 seconds

# Or reduce analysis range
"hours": 24  # Instead of 168
```

### 5. Memory Issues with Large Logs
**Issue**: Node.js runs out of memory analyzing extensive logs.

**Solution**:
- Limit sessions analyzed: `export RECAP_MAX_SESSIONS=25`
- Use shorter time ranges
- Clean old log entries periodically
- Increase Node memory: `node --max-old-space-size=4096`

## Development Issues

### 6. TypeScript Compilation Errors
**Issue**: Type errors when building after modifications.

**Solution**:
- Run `npm run build` frequently during development
- Use `npm run dev` for watch mode
- Ensure all imports have proper types
- Check tsconfig.json strict mode settings

### 7. Test Failures After Updates
**Issue**: Tests fail after modifying intent detection logic.

**Solution**:
1. Update test expectations to match new behavior
2. Add new test cases for edge conditions
3. Run tests in watch mode: `npm test -- --watch`
4. Check test coverage: `npm test -- --coverage`

### 8. Circular Dependency Warnings
**Issue**: Warnings about circular dependencies in build output.

**Solution**:
- Keep types.ts purely for type definitions
- Move implementation logic out of type files
- Use barrel exports carefully
- Check with: `npx madge --circular src/`
## Integration Issues

### 9. MCP Protocol Errors
**Issue**: "Invalid JSON-RPC" errors in Claude Desktop.

**Solution**:
- Ensure proper stdio handling in custom-stdio.ts
- Check for console.log statements in production code
- Validate JSON output format
- Test with: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js`

### 10. Recovery Mode Not Working
**Issue**: Recovery mode returns empty or incorrect state.

**Solution**:
- Ensure sessions have proper boundaries (>5 min gaps)
- Check that interrupted sessions are detected
- Verify timestamp parsing is correct
- Use verbose mode to debug: `{"recovery": true, "verbose": true}`

### 11. Changes Not Reflecting in Claude
**Issue**: Modified code doesn't work even after saving files.

**Solution**:
```bash
# Build BOTH projects in correct order
cd /Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap
npm run build

cd ../Recap
npm run build

# CRITICAL: Restart Claude Desktop
# Claude caches MCP servers - restart is mandatory!
```

**Common Mistakes**:
- Forgetting to build after changes
- Building only one project
- Not restarting Claude Desktop
- Testing immediately without restart

## Performance Issues

### 12. Slow Analysis on Windows
**Issue**: Recap takes much longer on Windows than Mac/Linux.

**Solution**:
- Use WSL2 for better performance
- Ensure antivirus isn't scanning log files
- Use SSD for log file location
- Consider smaller analysis windows

### 13. File Handle Limits
**Issue**: "EMFILE: too many open files" errors.

**Solution**:
```bash
# Mac/Linux: Increase file limits
ulimit -n 4096

# Or use graceful-fs in code
npm install graceful-fs
```

## Prevention Strategies

### Best Practices:
1. **Regular Testing**: Run tests before and after changes
2. **Incremental Development**: Small, tested changes
3. **Clean Dependencies**: Run `npm ci` for clean installs
4. **Version Locking**: Use exact versions in package.json
5. **Environment Isolation**: Use .env.local for dev settings

### Debugging Workflow:
1. Check logs first: `tail -f ~/.claude-server-commander/claude_tool_call.log`
2. Test MCP server directly: `npm run test:server`
3. Verify enhanced format: Look for intent fields
4. Use verbose output: `{"verbose": true}`
5. Check Claude Desktop logs for errors
6. **If changes not working**: Did you build BOTH projects and restart Claude?

### Common Mistakes to Avoid:
- ❌ Using relative paths in config
- ❌ Forgetting to rebuild after changes
- ❌ Not restarting Claude Desktop after building
- ❌ Building only one project when both need updates
- ❌ Testing immediately without Claude restart
- ❌ Mixing original and enhanced DesktopCommanderMCP
- ❌ Hardcoding log paths
- ❌ Ignoring TypeScript errors
- ❌ Skipping tests "just this once"
- ❌ Large commits with multiple changes
- ❌ Leaving debug console.log statements

### Quick Fixes Reference:
```bash
# Rebuild everything
npm run rebuild

# Test basic functionality
npm test

# Verify MCP protocol
npm run test:server

# Check enhanced logs
grep -c "intent" ~/.claude-server-commander/claude_tool_call.log

# Clean and reinstall
rm -rf node_modules dist
npm ci
npm run build

# CRITICAL: After modifying MCP tools
cd /Users/ehukaimedia/Desktop/AI-Applications/Node/DesktopCommanderMCP-Recap
npm run build
cd ../Recap
npm run build
# RESTART Claude Desktop!
```

Remember: Most issues come from configuration, not code. Always verify setup first!

## 🔴 CRITICAL REMINDER
**After ANY changes to MCP tools**:
1. Build DesktopCommanderMCP-Recap: `npm run build`
2. Build RecapMCP: `npm run build` 
3. **RESTART Claude Desktop** - No exceptions!

Without these steps, your changes will NOT take effect and you'll waste time debugging code that isn't even running.