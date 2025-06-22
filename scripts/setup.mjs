#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

console.log('🚀 RecapMCP Setup - Complete Installation & Configuration\n');

// Detect operating system
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

console.log(`📱 Detected OS: ${platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'}`);

// Step 1: Build the project
console.log('\n📦 Building RecapMCP server...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Install globally
console.log('\n🌍 Installing RecapMCP globally...');
let globalInstallSuccess = false;
try {
  if (isWindows) {
    // Windows doesn't typically need sudo
    execSync('npm install -g .', { stdio: 'inherit' });
  } else {
    // Mac/Linux - try without sudo first, then with sudo if needed
    try {
      execSync('npm install -g .', { stdio: 'inherit' });
    } catch (error) {
      console.log('🔐 Permission required - attempting with sudo...');
      execSync('sudo npm install -g .', { stdio: 'inherit' });
    }
  }
  console.log('✅ Global installation completed');
  globalInstallSuccess = true;
} catch (error) {
  console.error('❌ Global installation failed:', error.message);
  console.log('\n💡 Will configure to use local installation instead');
}

// Step 3: Configure Claude Desktop
console.log('\n⚙️  Configuring Claude Desktop...');

// Find Claude Desktop config path
let configPath;
if (isMac) {
  configPath = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
} else if (isWindows) {
  configPath = path.join(process.env.APPDATA, 'Claude/claude_desktop_config.json');
} else {
  // Linux - try common locations
  const possiblePaths = [
    path.join(os.homedir(), '.config/Claude/claude_desktop_config.json'),
    path.join(os.homedir(), '.claude/claude_desktop_config.json')
  ];
  configPath = possiblePaths.find(p => fs.existsSync(path.dirname(p)));
  if (!configPath) {
    configPath = possiblePaths[0]; // Use first as default
  }
}

console.log(`📁 Claude config path: ${configPath}`);

// Ensure config directory exists
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  console.log(`📁 Creating config directory: ${configDir}`);
  fs.mkdirSync(configDir, { recursive: true });
}

// Read or create config
let config = {};
if (fs.existsSync(configPath)) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configContent);
    console.log('📖 Existing Claude config found');
  } catch (error) {
    console.log('⚠️  Existing config file was invalid, creating new one');
    config = {};
  }
} else {
  console.log('📄 Creating new Claude config file');
}

// Add RecapMCP server configuration
if (!config.mcpServers) {
  config.mcpServers = {};
}

// Use global command if available, otherwise use local path
if (globalInstallSuccess) {
  config.mcpServers.recap = {
    command: "recap-mcp",
    args: []
  };
} else {
  // Use local installation with absolute path
  const currentDir = process.cwd();
  const localPath = path.join(currentDir, 'dist', 'index.js');
  config.mcpServers.recap = {
    command: "node",
    args: [localPath]
  };
  console.log(`📍 Using local installation: ${localPath}`);
}

// Write updated config
try {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Claude Desktop configuration updated');
} catch (error) {
  console.error('❌ Failed to write Claude config:', error.message);
  console.log('\n📝 Manual configuration required:');
  console.log(`Add this to ${configPath}:`);
  console.log(JSON.stringify({ mcpServers: { recap: { command: "recap-mcp", args: [] } } }, null, 2));
}

// Step 4: Test the installation
console.log('\n🧪 Testing RecapMCP server...');
try {
  if (globalInstallSuccess) {
    const testCommand = isWindows ? 'recap-mcp' : 'which recap-mcp';
    execSync(testCommand, { stdio: 'pipe' });
    console.log('✅ RecapMCP command is available globally');
    
    // Test the actual functionality
    console.log('🔍 Testing recap functionality...');
    const testResult = execSync('echo \'{"jsonrpc":"2.0","id":1,"method":"tools/list"}\' | recap-mcp', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    if (testResult.includes('"name":"recap"')) {
      console.log('✅ RecapMCP server is working correctly');
    } else {
      console.log('⚠️  Server responded but recap tool not found');
    }
  } else {
    // Test local installation
    console.log('🔍 Testing local installation...');
    const testResult = execSync('echo \'{"jsonrpc":"2.0","id":1,"method":"tools/list"}\' | ./dist/index.js', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    if (testResult.includes('"name":"recap"')) {
      console.log('✅ Local RecapMCP server is working correctly');
    } else {
      console.log('⚠️  Server responded but recap tool not found');
    }
  }
} catch (error) {
  console.log('⚠️  Testing failed, but installation may still work');
  console.log('💡 Try manually with: ./dist/index.js');
}

// Step 5: Check for enhanced DesktopCommanderMCP
console.log('\n🔍 Checking for enhanced DesktopCommanderMCP...');
const logPath = path.join(os.homedir(), '.claude-server-commander', 'claude_tool_call.log');
if (fs.existsSync(logPath)) {
  // Check if logs contain enhanced format
  try {
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n').slice(-10); // Check last 10 lines
    const hasEnhancedFormat = lines.some(line => 
      line.includes('"session"') && line.includes('"project"')
    );
    
    if (hasEnhancedFormat) {
      console.log('✅ Enhanced DesktopCommanderMCP logging detected');
    } else {
      console.log('⚠️  DesktopCommanderMCP found but enhanced logging not detected');
      console.log('💡 Install enhanced version with:');
      console.log('   sudo npm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging');
    }
  } catch (error) {
    console.log('⚠️  Could not read DesktopCommanderMCP logs');
  }
} else {
  console.log('⚠️  DesktopCommanderMCP not found');
  console.log('💡 Install enhanced version with:');
  console.log('   sudo npm install -g git+https://github.com/ehukaimedia/DesktopCommanderMCP.git#contextual-logging');
}

// Final instructions
console.log('\n🎉 Setup Complete!');
console.log('━'.repeat(50));
console.log('\n📋 Next Steps:');
console.log('1. 🔄 Restart Claude Desktop application');
console.log('2. 💬 Ask Claude: "Can you give me a recap of my recent work?"');
console.log('3. ✨ Enjoy intelligent contextual insights!');

console.log('\n🔧 Configuration Details:');
console.log(`• RecapMCP server: ${config.mcpServers?.recap ? '✅ Configured' : '❌ Not configured'}`);
console.log(`• Config file: ${configPath}`);
if (globalInstallSuccess) {
  console.log('• Installation: ✅ Global (recap-mcp command)');
} else {
  console.log('• Installation: ✅ Local (node path)');
}

console.log('\n📚 Usage Examples:');
console.log('• "Give me a recap of my work today"');
console.log('• "Show me what I worked on in the last 8 hours"');
console.log('• "Can you analyze my recent productivity?"');

console.log('\n🆘 Troubleshooting:');
console.log('• If Claude doesn\'t see the recap tool, restart Claude Desktop');
console.log('• For permission issues, try: sudo npm install -g .');
console.log(`• Manual config location: ${configPath}`);
console.log('• Test locally with: ./dist/index.js');

console.log('\n🔗 Resources:');
console.log('• Enhanced DesktopCommanderMCP: https://github.com/ehukaimedia/DesktopCommanderMCP');
console.log('• Documentation: README_RecapMCP.md');

console.log('\n✨ Ready to transform your tool logs into intelligent insights! ✨');
