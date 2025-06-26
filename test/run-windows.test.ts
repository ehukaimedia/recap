/**
 * Windows-specific tests for the run tool
 * Ensures cross-platform compatibility
 */

import { jest } from '@jest/globals';
import { NodeRunner } from '../src/runners/nodeRunner.js';
import { PythonRunner } from '../src/runners/pythonRunner.js';
import type { ProjectContext, ProjectType, PackageManager } from '../src/types.js';

describe('Windows Compatibility', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  describe('Python Executable Detection', () => {
    it('should use py launcher on Windows', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const runner = new PythonRunner();
      const context: ProjectContext = {
        root: 'C:\\project',
        type: ['python' as ProjectType],
        packageManagers: ['pip' as PackageManager],
        frameworks: []
      };

      const commands = await runner.discoverCommands(context);
      const runCommand = commands.find(cmd => cmd.name === 'run');
      
      expect(runCommand?.executable).toBe('py');
    });

    it('should use python.exe in Windows virtual env', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const runner = new PythonRunner();
      const context: ProjectContext = {
        root: 'C:\\project',
        type: ['python' as ProjectType],
        packageManagers: ['pip' as PackageManager],
        frameworks: [],
        virtualEnv: 'venv'
      };

      const commands = await runner.discoverCommands(context);
      const runCommand = commands.find(cmd => cmd.name === 'run');
      
      // path.join will use the actual platform's separator, not the mocked one
      expect(runCommand?.executable).toBe('C:\\project/venv/Scripts/python.exe');
    });

    it('should handle Windows pip commands correctly', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const runner = new PythonRunner();
      const context: ProjectContext = {
        root: 'C:\\project',
        type: ['python' as ProjectType],
        packageManagers: ['pip' as PackageManager],
        frameworks: []
      };
      
      const commands = await runner.discoverCommands(context);
      const installCmd = commands.find(cmd => cmd.name === 'install');
      
      expect(installCmd?.executable).toBe('py');
      expect(installCmd?.args).toEqual(['-m', 'pip', 'install', '-r', 'requirements.txt']);
    });

    it('should use python3 on Unix systems', async () => {
      // Mock Unix platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      const runner = new PythonRunner();
      const context: ProjectContext = {
        root: '/home/project',
        type: ['python' as ProjectType],
        packageManagers: ['pip' as PackageManager],
        frameworks: []
      };

      const commands = await runner.discoverCommands(context);
      const runCommand = commands.find(cmd => cmd.name === 'run');
      
      expect(runCommand?.executable).toBe('python3');
    });
  });

  describe('Path Normalization', () => {
    it('should handle UNC paths on Windows', () => {
      const runner = new NodeRunner();
      const uncPath = '\\\\server\\share\\project\\file.js';
      const normalized = runner.normalizePath(uncPath, 'win32');
      
      expect(normalized).toBe('\\\\server\\share\\project\\file.js');
    });

    it('should handle drive letters correctly', () => {
      const runner = new NodeRunner();
      const drivePath = 'C:/Users/test/project';
      const normalized = runner.normalizePath(drivePath, 'win32');
      
      expect(normalized).toBe('C:\\Users\\test\\project');
    });

    it('should convert backslashes to forward slashes on Unix', () => {
      const runner = new NodeRunner();
      const winPath = 'C:\\Users\\test\\project';
      const normalized = runner.normalizePath(winPath, 'darwin');
      
      expect(normalized).toBe('C:/Users/test/project');
    });
  });

  describe('Command Formatting', () => {
    it('should format commands correctly for Windows', () => {
      const runner = new NodeRunner();
      const command = runner.formatCommand('npm', ['run', 'build'], 'win32');
      
      expect(command.shell).toBe('cmd.exe');
      expect(command.args).toEqual(['/c', 'npm', 'run', 'build']);
    });

    it('should format commands correctly for Unix', () => {
      const runner = new NodeRunner();
      const command = runner.formatCommand('npm', ['run', 'build'], 'darwin');
      
      expect(command.shell).toBe('/bin/sh');
      expect(command.args).toEqual(['-c', 'npm run build']);
    });

    it('should handle spaces in executable paths on Windows', () => {
      const runner = new NodeRunner();
      const command = runner.formatCommand(
        'C:\\Program Files\\Node\\node.exe',
        ['script.js'],
        'win32'
      );
      
      expect(command.shell).toBe('cmd.exe');
      expect(command.args[1]).toBe('C:\\Program Files\\Node\\node.exe');
    });
  });
});
