# Enhanced DesktopCommanderMCP Installation Protocol

## Overview
Deploy the enhanced contextual logging `trackTools.ts` to DesktopCommanderMCP installations across multiple computers (PC, Mac, Linux).

## Prerequisites
- DesktopCommanderMCP already installed and working
- Enhanced `trackTools.ts` file ready for deployment
- Administrative/sudo access if needed

## Step 1: Locate DesktopCommanderMCP Installation

### Method A: Find Global npm Installation
```bash
# On Mac/Linux
npm list -g @wonderwhy-er/desktop-commander
npm root -g

# On Windows (PowerShell/CMD)
npm list -g @wonderwhy-er/desktop-commander
npm root -g
```

### Method B: Find Local Installation
```bash
# Search for the package directory
find /usr -name "desktop-commander" 2>/dev/null
find /opt -name "desktop-commander" 2>/dev/null
find $HOME -name "desktop-commander" 2>/dev/null

# On Windows
dir "desktop-commander" /s
```

### Common Installation Paths:

**Mac:**
- Global: `/usr/local/lib/node_modules/@wonderwhy-er/desktop-commander/`
- Local: `~/node_modules/@wonderwhy-er/desktop-commander/`
- Homebrew: `/opt/homebrew/lib/node_modules/@wonderwhy-er/desktop-commander/`

**Windows:**
- Global: `C:\Users\[USERNAME]\AppData\Roaming\npm\node_modules\@wonderwhy-er\desktop-commander\`
- Local: `.\node_modules\@wonderwhy-er\desktop-commander\`

**Linux:**
- Global: `/usr/local/lib/node_modules/@wonderwhy-er/desktop-commander/`
- Local: `~/node_modules/@wonderwhy-er/desktop-commander/`

## Step 2: Backup Original File

```bash
# Navigate to the installation directory
cd [INSTALLATION_PATH]

# Create backup of original trackTools.ts
cp src/utils/trackTools.ts src/utils/trackTools.ts.backup

# Verify backup was created
ls -la src/utils/trackTools.ts*
```

## Step 3: Deploy Enhanced Version

### Option A: Direct Copy
```bash
# Copy your enhanced file
cp /Users/ehukaimedia/Desktop/AI-Applications/Node/Recap/DC/trackTools.ts src/utils/trackTools.ts
```

### Option B: Secure Transfer (for remote machines)
```bash
# From your Mac, copy to other machines
scp /Users/ehukaimedia/Desktop/AI-Applications/Node/Recap/DC/trackTools.ts user@remote-machine:/tmp/

# On remote machine
sudo cp /tmp/trackTools.ts [INSTALLATION_PATH]/src/utils/trackTools.ts
```

### Option C: Manual Copy
1. Open the enhanced file: `/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap/DC/trackTools.ts`
2. Copy all contents
3. Navigate to target machine's installation
4. Replace contents of `src/utils/trackTools.ts`

## Step 4: Rebuild DesktopCommanderMCP

```bash
# Navigate to installation directory
cd [INSTALLATION_PATH]

# Install dependencies (if needed)
npm install

# Rebuild the project
npm run build

# Verify build succeeded
ls -la dist/utils/trackTools.js
```

## Step 5: Restart DesktopCommanderMCP

### If Running as Service (systemd on Linux)
```bash
sudo systemctl restart desktop-commander
sudo systemctl status desktop-commander
```

### If Running as Process
```bash
# Find the process
ps aux | grep desktop-commander

# Kill the process
kill [PID]

# Restart (method depends on how you start it)
desktop-commander
# or
node dist/index.js
```

### If Integrated with Claude Desktop
1. Quit Claude Desktop application
2. Restart Claude Desktop
3. The MCP server will restart automatically

## Step 6: Verify Enhanced Logging

```bash
# Check if the log file exists
ls -la ~/.claude-server-commander/claude_tool_call.log

# Test with a simple command
# (This will be logged with contextual information)
desktop-commander --help

# Check recent log entries for new format
tail -5 ~/.claude-server-commander/claude_tool_call.log
```

**Expected Enhanced Format:**
```
2025-06-22T19:48:44.834Z | list_directory | {"session":"mc82z3xe_a289r8","sessionAge":"0m","newSession":true,"project":"Node","files":["Recap"]} | Args: {"path":"..."}
```

## Step 7: Platform-Specific Notes

### Windows Specifics
- Use PowerShell as Administrator
- Path separators are `\` instead of `/`
- npm global directory: `%APPDATA%\npm\node_modules\`
- Use `dir` instead of `ls`

### Mac Specifics
- May need `sudo` for global installations
- Homebrew installations are in `/opt/homebrew/`
- Use `brew services restart` if installed via Homebrew

### Linux Specifics
- Likely need `sudo` for global installations
- Check if running as systemd service
- May be in `/usr/local/` or `/opt/`

## Step 8: Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run build 2>&1 | grep error

# Verify file syntax
node -c src/utils/trackTools.ts
```

### Logging Not Working
```bash
# Check permissions on log directory
ls -la ~/.claude-server-commander/

# Manually create if needed
mkdir -p ~/.claude-server-commander/
chmod 755 ~/.claude-server-commander/
```

### Service Won't Start
```bash
# Check logs for errors
journalctl -u desktop-commander -f  # Linux systemd
# or check Claude Desktop logs
```

## Quick Installation Script

Create a script for easy deployment:

```bash
#!/bin/bash
# deploy-enhanced-logging.sh

ENHANCED_FILE="/Users/ehukaimedia/Desktop/AI-Applications/Node/Recap/DC/trackTools.ts"
INSTALL_PATH=$(npm root -g)/@wonderwhy-er/desktop-commander

echo "Deploying enhanced logging to: $INSTALL_PATH"

# Backup original
cp "$INSTALL_PATH/src/utils/trackTools.ts" "$INSTALL_PATH/src/utils/trackTools.ts.backup"

# Deploy enhanced version
cp "$ENHANCED_FILE" "$INSTALL_PATH/src/utils/trackTools.ts"

# Rebuild
cd "$INSTALL_PATH"
npm run build

echo "Enhanced logging deployed successfully!"
echo "Please restart DesktopCommanderMCP/Claude Desktop"
```

## Verification Checklist

- [ ] Original `trackTools.ts` backed up
- [ ] Enhanced version copied successfully
- [ ] Project builds without errors
- [ ] Service/application restarted
- [ ] Log file shows new contextual format
- [ ] Session IDs, workflows, and project names appear in logs

## Rollback Procedure

If issues occur:
```bash
# Restore original
cp src/utils/trackTools.ts.backup src/utils/trackTools.ts

# Rebuild
npm run build

# Restart service
```

This protocol ensures consistent deployment across all your machines while maintaining safety through backups and verification steps.