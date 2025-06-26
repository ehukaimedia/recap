/**
 * Universal Run Tool
 * Zero-configuration script runner for Node.js and Python projects
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { 
  RunArgs, 
  RunArgsSchema, 
  MCPToolResponse,
  Command,
  ExecutionResult
} from './types.js';
import { ProjectDetector } from './projectDetector.js';
import { NodeRunner } from './runners/nodeRunner.js';
import { PythonRunner } from './runners/pythonRunner.js';

// Export schema for server registration
export { RunArgsSchema } from './types.js';

// Runner registry
const runners = [
  new NodeRunner(),
  new PythonRunner()
];

/**
 * Main handler for the run tool
 */
export async function handleRun(args: RunArgs): Promise<MCPToolResponse> {
  try {
    // Determine project path
    const projectPath = args.projectPath 
      ? path.resolve(args.projectPath)
      : process.cwd();

    // Detect project context
    const detector = new ProjectDetector();
    const projectRoot = await detector.findProjectRoot(projectPath);
    const context = await detector.detectProject(projectRoot);

    // If no command specified, list available commands
    if (!args.command) {
      return await listAvailableCommands(context);
    }

    // Execute the specified command
    return await executeCommand(args.command, args, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: 'text',
        text: `❌ Error: ${errorMessage}`
      }],
      isError: true
    };
  }
}/**
 * List available commands for the project
 */
async function listAvailableCommands(context: any): Promise<MCPToolResponse> {
  const allCommands: Command[] = [];

  // Gather commands from all applicable runners
  for (const runner of runners) {
    if (context.type.includes(runner.name)) {
      const commands = await runner.discoverCommands(context);
      allCommands.push(...commands);
    }
  }

  if (allCommands.length === 0) {
    return {
      content: [{
        type: 'text',
        text: '📭 No commands found in this project.\n\n' +
              `Project type: ${context.type.join(', ')}\n` +
              `Location: ${context.root}`
      }],
      isError: false
    };
  }

  // Group commands by category
  const grouped = allCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Format output
  let output = `🚀 Available commands in ${path.basename(context.root)}\n`;
  output += `📁 ${context.root}\n`;
  output += `🔧 Type: ${context.type.join(', ')}\n`;
  output += `📦 Package managers: ${context.packageManagers.join(', ')}\n\n`;

  const categoryIcons: Record<string, string> = {
    dev: '🔨',
    build: '🏗️',
    test: '🧪',
    deploy: '🚀',
    utils: '🔧',
    custom: '⚡'
  };

  for (const [category, commands] of Object.entries(grouped)) {
    output += `${categoryIcons[category] || '📌'} ${category.toUpperCase()}\n`;
    for (const cmd of commands) {
      output += `  ${cmd.displayName.padEnd(20)} ${cmd.description}\n`;
    }
    output += '\n';
  }

  output += '\n💡 Usage: run <command> [args...]\n';
  output += '   Example: run build --watch\n';

  return {
    content: [{
      type: 'text',
      text: output
    }],
    isError: false
  };
}/**
 * Execute a specific command
 */
async function executeCommand(
  commandName: string, 
  args: RunArgs, 
  context: any
): Promise<MCPToolResponse> {
  // Find the command
  let command: Command | undefined;
  let runner: any;

  for (const r of runners) {
    if (context.type.includes(r.name)) {
      const commands = await r.discoverCommands(context);
      command = commands.find(cmd => cmd.name === commandName);
      if (command) {
        runner = r;
        break;
      }
    }
  }

  if (!command) {
    // Try to run as a direct command
    return await runDirectCommand(commandName, args);
  }

  // Execute the command
  const result = await runCommand(command, args, runner);

  // Format response
  let output = `🏃 Running: ${command.displayName}\n`;
  output += `📁 Working directory: ${command.workingDir || context.root}\n`;
  output += `⏱️  Duration: ${result.duration}ms\n\n`;

  if (result.stdout) {
    output += `📤 Output:\n${result.stdout}\n`;
  }

  if (result.stderr && !result.success) {
    output += `\n⚠️  Errors:\n${result.stderr}\n`;
  }

  if (result.timedOut) {
    output += `\n⏰ Command timed out after ${args.timeout}ms\n`;
  }

  return {
    content: [{
      type: 'text',
      text: output
    }],
    isError: !result.success
  };
}/**
 * Run a command using the appropriate runner
 */
async function runCommand(
  command: Command,
  args: RunArgs,
  runner: any
): Promise<ExecutionResult> {
  const platform = os.platform() as NodeJS.Platform;
  const formatted = runner.formatCommand(
    command.executable,
    [...command.args, ...args.args],
    platform
  );

  // Merge environment variables
  const env = {
    ...process.env,
    ...command.env,
    ...args.env
  };

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const proc = spawn(formatted.shell, formatted.args, {
      cwd: command.workingDir,
      env,
      shell: false
    });

    // Set timeout
    const timer = setTimeout(() => {
      timedOut = true;
      // Windows doesn't support POSIX signals, use taskkill instead
      if (process.platform === 'win32' && proc.pid) {
        spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
      } else {
        proc.kill('SIGTERM');
      }
    }, args.timeout);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0 && !timedOut,
        code,
        stdout,
        stderr,
        duration: Date.now() - startTime,
        timedOut
      });
    });

    proc.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        success: false,
        code: null,
        stdout,
        stderr: error.message,
        duration: Date.now() - startTime,
        timedOut: false
      });
    });
  });
}/**
 * Run a direct command (not from project scripts)
 */
async function runDirectCommand(
  commandName: string,
  args: RunArgs
): Promise<MCPToolResponse> {
  const platform = os.platform() as NodeJS.Platform;
  const isWindows = platform === 'win32';

  const result = await new Promise<ExecutionResult>((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows 
      ? ['/c', commandName, ...args.args]
      : ['-c', `${commandName} ${args.args.join(' ')}`];

    const proc = spawn(shell, shellArgs, {
      cwd: args.projectPath || process.cwd(),
      env: { ...process.env, ...args.env },
      shell: false
    });

    const timer = setTimeout(() => {
      timedOut = true;
      // Windows doesn't support POSIX signals, use taskkill instead
      if (process.platform === 'win32' && proc.pid) {
        spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
      } else {
        proc.kill('SIGTERM');
      }
    }, args.timeout);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0 && !timedOut,
        code,
        stdout,
        stderr,
        duration: Date.now() - startTime,
        timedOut
      });
    });

    proc.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        success: false,
        code: null,
        stdout,
        stderr: error.message,
        duration: Date.now() - startTime,
        timedOut: false
      });
    });
  });

  let output = `🏃 Running: ${commandName} ${args.args.join(' ')}\n`;
  output += `⏱️  Duration: ${result.duration}ms\n\n`;

  if (result.stdout) {
    output += `📤 Output:\n${result.stdout}\n`;
  }

  if (result.stderr && !result.success) {
    output += `\n⚠️  Errors:\n${result.stderr}\n`;
  }

  if (result.timedOut) {
    output += `\n⏰ Command timed out after ${args.timeout}ms\n`;
  }

  return {
    content: [{
      type: 'text',
      text: output
    }],
    isError: !result.success
  };
}