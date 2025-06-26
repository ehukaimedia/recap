/**
 * Universal Run Tool Tests
 * Following TDD approach for MCP tool implementation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RunArgsSchema, handleRun } from '../src/run.js';
import { ProjectDetector } from '../src/projectDetector.js';
import { NodeRunner } from '../src/runners/nodeRunner.js';
import { PythonRunner } from '../src/runners/pythonRunner.js';
import { ProjectContext, ProjectType } from '../src/types.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Universal Run Tool', () => {
  describe('Tool Schema', () => {
    it('should have valid Zod schema for run arguments', () => {
      // Test default values
      const defaultArgs = RunArgsSchema.parse({});
      expect(defaultArgs.command).toBeUndefined();
      expect(defaultArgs.projectPath).toBeUndefined();
      expect(defaultArgs.args).toEqual([]);
      expect(defaultArgs.env).toEqual({});
      expect(defaultArgs.timeout).toBe(30000);
    });

    it('should accept valid run arguments', () => {
      const args = RunArgsSchema.parse({
        command: 'build',
        projectPath: '/path/to/project',
        args: ['--watch'],
        env: { NODE_ENV: 'production' },
        timeout: 60000
      });
      
      expect(args.command).toBe('build');
      expect(args.projectPath).toBe('/path/to/project');
      expect(args.args).toEqual(['--watch']);
      expect(args.env.NODE_ENV).toBe('production');
      expect(args.timeout).toBe(60000);
    });
  });

  describe('Project Detection', () => {
    let tempDir: string;
    
    beforeEach(async () => {
      // Create temporary directory for testing
      tempDir = path.join(os.tmpdir(), `run-test-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
    });
    
    afterEach(async () => {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should detect Node.js project by package.json', async () => {
      // Create a package.json
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            build: 'echo "Building..."',
            test: 'jest'
          }
        }, null, 2)
      );

      const detector = new ProjectDetector();
      const context = await detector.detectProject(tempDir);
      
      expect(context.type).toContain('node');
      expect(context.root).toBe(tempDir);
      expect(context.packageManagers).toContain('npm');
    });

    it('should detect Python project by requirements.txt', async () => {
      // Create requirements.txt
      await fs.writeFile(
        path.join(tempDir, 'requirements.txt'),
        'flask==2.0.0\npytest==7.0.0\n'
      );

      const detector = new ProjectDetector();
      const context = await detector.detectProject(tempDir);
      
      expect(context.type).toContain('python');
      expect(context.root).toBe(tempDir);
      expect(context.packageManagers).toContain('pip');
    });

    it('should detect Python virtual environment', async () => {
      // Create requirements.txt to make it a Python project
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0');
      
      // Create venv structure
      const venvPath = path.join(tempDir, 'venv');
      await fs.mkdir(path.join(venvPath, 'bin'), { recursive: true });
      await fs.writeFile(path.join(venvPath, 'pyvenv.cfg'), 'home = /usr/bin');
      
      const detector = new ProjectDetector();
      const context = await detector.detectProject(tempDir);
      
      expect(context.virtualEnv).toBe('venv');
    });
  });

  describe('Command Discovery', () => {
    it('should discover npm scripts from package.json', async () => {
      const projectContext: ProjectContext = {
        root: '/test/project',
        type: ['node' as ProjectType],
        packageManagers: ['npm'],
        metadata: {
          packageJson: {
            scripts: {
              dev: 'next dev',
              build: 'next build',
              test: 'jest',
              'test:watch': 'jest --watch',
              lint: 'eslint .',
              'prebuild': 'npm run clean',
              'postbuild': 'npm run optimize'
            }
          }
        }
      };

      const runner = new NodeRunner();
      const commands = await runner.discoverCommands(projectContext);
      
      expect(commands).toHaveLength(5); // Should exclude pre/post scripts
      expect(commands.find(c => c.name === 'dev')).toBeDefined();
      expect(commands.find(c => c.name === 'build')).toBeDefined();
      expect(commands.find(c => c.name === 'test')).toBeDefined();
      expect(commands.find(c => c.name === 'test:watch')).toBeDefined();
      expect(commands.find(c => c.name === 'lint')).toBeDefined();
      
      // Check categorization
      expect(commands.find(c => c.name === 'dev')?.category).toBe('dev');
      expect(commands.find(c => c.name === 'build')?.category).toBe('build');
      expect(commands.find(c => c.name === 'test')?.category).toBe('test');
    });
  });

  describe('Cross-Platform Execution', () => {
    it('should handle Windows command formatting', () => {
      const runner = new NodeRunner();
      const command = runner.formatCommand('npm', ['run', 'build'], 'win32');
      
      expect(command.shell).toBe('cmd.exe');
      expect(command.args).toEqual(['/c', 'npm', 'run', 'build']);
    });

    it('should handle Unix command formatting', () => {
      const runner = new NodeRunner();
      const command = runner.formatCommand('npm', ['run', 'build'], 'darwin');
      
      expect(command.shell).toBe('/bin/sh');
      expect(command.args).toEqual(['-c', 'npm run build']);
    });

    it('should handle path separators correctly', () => {
      const runner = new NodeRunner();
      const winPath = runner.normalizePath('/Users/test/project', 'win32');
      const unixPath = runner.normalizePath('C:\\Users\\test\\project', 'darwin');
      
      expect(winPath).toMatch(/\\/);
      expect(unixPath).toMatch(/\//);
    });
  });

  describe('Run Tool Handler', () => {
    it('should list available commands when no command specified', async () => {
      const result = await handleRun({
        args: [],
        env: {},
        timeout: 30000
      });
      
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Available commands');
    });

    it('should execute specified command', async () => {
      const result = await handleRun({
        command: 'echo',
        args: ['Hello World'],
        env: {},
        timeout: 5000
      });
      
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('Hello World');
    });

    it('should handle command timeout', async () => {
      const result = await handleRun({
        command: 'sleep',
        args: ['10'],
        env: {},
        timeout: 100
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('timed out');
    });

    it('should run direct commands not in project scripts', async () => {
      const result = await handleRun({
        command: 'node',
        args: ['--version'],
        projectPath: '/tmp',
        env: {},
        timeout: 5000
      });
      
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('Running: node --version');
      expect(result.content[0].text).toMatch(/v\d+\.\d+\.\d+/); // Node version pattern
    });

    it('should handle non-existent commands', async () => {
      const result = await handleRun({
        command: 'non-existent-command-12345',
        args: [],
        env: {},
        timeout: 5000
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Errors:');
    });

    it('should pass environment variables to commands', async () => {
      const result = await handleRun({
        command: process.platform === 'win32' ? 'echo %TEST_VAR%' : 'echo $TEST_VAR',
        args: [],
        env: { TEST_VAR: 'test-value-123' },
        timeout: 5000
      });
      
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('test-value-123');
    });

    it('should handle command with stderr output', async () => {
      const result = await handleRun({
        command: 'node',
        args: ['-e', 'console.error("Error message")'],
        env: {},
        timeout: 5000
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error message');
    });

    it('should execute project scripts with working directory', async () => {
      // Create a temporary test project
      const tempDir = path.join(os.tmpdir(), `run-test-project-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      // Create package.json with test script
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          scripts: {
            'show-cwd': 'pwd || cd'
          }
        }, null, 2)
      );
      
      try {
        const result = await handleRun({
          command: 'show-cwd',
          projectPath: tempDir,
          args: [],
          env: {},
          timeout: 5000
        });
        
        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain(tempDir);
      } finally {
        // Clean up
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle spawn process errors', async () => {
      const result = await handleRun({
        command: '/invalid/path/to/executable',
        args: [],
        env: {},
        timeout: 5000
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Errors:');
    });

    it('should handle process termination on timeout across platforms', async () => {
      // Use platform-appropriate sleep command
      const isWindows = process.platform === 'win32';
      const sleepCmd = isWindows ? 'timeout' : 'sleep';
      const sleepArgs = isWindows ? ['/t', '10'] : ['10'];
      
      const result = await handleRun({
        command: sleepCmd,
        args: sleepArgs,
        env: {},
        timeout: 100
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('timed out');
    });

    it('should handle errors in handleRun function', async () => {
      // Test with invalid projectPath that should throw an error
      const result = await handleRun({
        command: 'test',
        projectPath: '/invalid\0path', // Invalid path with null character
        args: [],
        env: {},
        timeout: 5000
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('❌ Error:');
    });

    it('should handle empty project context with no commands', async () => {
      // Create a directory with no project files
      const tempDir = path.join(os.tmpdir(), `empty-project-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      try {
        const result = await handleRun({
          projectPath: tempDir,
          args: [],
          env: {},
          timeout: 5000
        });
        
        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('No commands found');
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});