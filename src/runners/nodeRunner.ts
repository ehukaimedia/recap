/**
 * Node.js Runner Module
 * Handles Node.js project command discovery and execution
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { 
  ProjectContext, 
  Command, 
  CommandCategory, 
  RunnerModule,
  FormattedCommand 
} from '../types.js';

export class NodeRunner implements RunnerModule {
  name = 'node';

  /**
   * Check if this is a Node.js project
   */
  async detectProject(root: string): Promise<boolean> {
    try {
      await fs.access(path.join(root, 'package.json'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Discover available commands from package.json
   */
  async discoverCommands(context: ProjectContext): Promise<Command[]> {
    if (!context.metadata?.packageJson?.scripts) {
      return [];
    }

    const scripts = context.metadata.packageJson.scripts;
    const commands: Command[] = [];

    for (const [name, script] of Object.entries(scripts)) {
      // Skip pre/post scripts
      if (name.startsWith('pre') || name.startsWith('post')) {
        continue;
      }

      const category = this.categorizeCommand(name, script as string);
      const packageManager = context.packageManagers[0] || 'npm';

      commands.push({
        name,
        displayName: name,
        description: this.generateDescription(name, script as string),
        category,
        executable: packageManager,
        args: ['run', name],
        workingDir: context.root
      });
    }

    return commands;
  }
  /**
   * Format command for cross-platform execution
   */
  formatCommand(executable: string, args: string[], platform: NodeJS.Platform): FormattedCommand {
    if (platform === 'win32') {
      return {
        shell: 'cmd.exe',
        args: ['/c', executable, ...args]
      };
    } else {
      // Unix-like systems (macOS, Linux)
      return {
        shell: '/bin/sh',
        args: ['-c', `${executable} ${args.join(' ')}`]
      };
    }
  }

  /**
   * Normalize file paths for the platform
   */
  normalizePath(filePath: string, platform: NodeJS.Platform): string {
    if (platform === 'win32') {
      return filePath.replace(/\//g, '\\');
    } else {
      return filePath.replace(/\\/g, '/');
    }
  }

  /**
   * Categorize command based on name and content
   */
  private categorizeCommand(name: string, script: string): CommandCategory {
    const lowerName = name.toLowerCase();
    const lowerScript = script.toLowerCase();

    // Development commands
    if (lowerName.includes('dev') || lowerName.includes('start') || 
        lowerName.includes('serve') || lowerName.includes('watch')) {
      return 'dev';
    }

    // Build commands
    if (lowerName.includes('build') || lowerName.includes('compile') ||
        lowerScript.includes('webpack') || lowerScript.includes('tsc')) {
      return 'build';
    }

    // Test commands
    if (lowerName.includes('test') || lowerScript.includes('jest') ||
        lowerScript.includes('mocha') || lowerScript.includes('vitest')) {
      return 'test';
    }

    // Deploy commands
    if (lowerName.includes('deploy') || lowerName.includes('publish') ||
        lowerName.includes('release')) {
      return 'deploy';
    }

    // Default to utils
    return 'utils';
  }  /**
   * Generate description for a command
   */
  private generateDescription(name: string, script: string): string {
    // Common script patterns
    const patterns: Array<[RegExp, string]> = [
      [/next dev/i, 'Start Next.js development server'],
      [/next build/i, 'Build Next.js application for production'],
      [/jest/i, 'Run tests with Jest'],
      [/vitest/i, 'Run tests with Vitest'],
      [/eslint/i, 'Lint code with ESLint'],
      [/prettier/i, 'Format code with Prettier'],
      [/tsc/i, 'Compile TypeScript'],
      [/webpack/i, 'Bundle with Webpack'],
      [/vite/i, 'Start Vite development server'],
      [/nodemon/i, 'Run with auto-restart on file changes'],
      [/concurrently/i, 'Run multiple commands concurrently'],
      [/cross-env/i, 'Set environment variables cross-platform']
    ];

    for (const [pattern, description] of patterns) {
      if (pattern.test(script)) {
        return description;
      }
    }

    // Generic descriptions based on command name
    const lowerName = name.toLowerCase();
    if (lowerName.includes('dev')) return 'Start development server';
    if (lowerName.includes('build')) return 'Build for production';
    if (lowerName.includes('test')) return 'Run tests';
    if (lowerName.includes('lint')) return 'Lint code';
    if (lowerName.includes('format')) return 'Format code';
    if (lowerName.includes('clean')) return 'Clean build artifacts';
    if (lowerName.includes('install')) return 'Install dependencies';

    // Truncate long scripts
    if (script.length > 50) {
      return script.substring(0, 47) + '...';
    }

    return script;
  }
}