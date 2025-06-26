/**
 * Python Runner Module
 * Handles Python project command discovery and execution
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

export class PythonRunner implements RunnerModule {
  name = 'python';

  /**
   * Check if this is a Python project
   */
  async detectProject(root: string): Promise<boolean> {
    const pythonMarkers = [
      'requirements.txt',
      'setup.py',
      'pyproject.toml',
      'Pipfile',
      'environment.yml'
    ];

    for (const marker of pythonMarkers) {
      try {
        await fs.access(path.join(root, marker));
        return true;
      } catch {
        // Continue checking
      }
    }
    return false;
  }

  /**
   * Discover available commands for Python projects
   */
  async discoverCommands(context: ProjectContext): Promise<Command[]> {
    const commands: Command[] = [];
    const pythonExe = this.getPythonExecutable(context);

    // Add common Python commands
    commands.push({
      name: 'run',
      displayName: 'run',
      description: 'Run Python script',
      category: 'dev',
      executable: pythonExe,
      args: [],
      workingDir: context.root
    });

    // Framework-specific commands
    if (context.frameworks?.includes('django')) {
      commands.push(...this.getDjangoCommands(context, pythonExe));
    }

    if (context.frameworks?.includes('flask')) {
      commands.push(...this.getFlaskCommands(context, pythonExe));
    }

    if (context.frameworks?.includes('fastapi')) {
      commands.push(...this.getFastAPICommands(context, pythonExe));
    }

    // Package manager commands
    const packageManager = context.packageManagers[0];
    if (packageManager) {
      commands.push(...this.getPackageManagerCommands(context, packageManager));
    }

    // Test commands
    commands.push(...this.getTestCommands(context, pythonExe));

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
   * Get Python executable based on virtual environment
   */
  private getPythonExecutable(context: ProjectContext): string {
    if (context.virtualEnv) {
      if (process.platform === 'win32') {
        return path.join(context.root, context.virtualEnv, 'Scripts', 'python.exe');
      } else {
        return path.join(context.root, context.virtualEnv, 'bin', 'python');
      }
    }
    
    // Better default detection
    if (process.platform === 'win32') {
      // Try py launcher first (modern Windows Python)
      return 'py';
    }
    return 'python3';
  }  /**
   * Get Django-specific commands
   */
  private getDjangoCommands(context: ProjectContext, pythonExe: string): Command[] {
    return [
      {
        name: 'runserver',
        displayName: 'Django Dev Server',
        description: 'Run Django development server',
        category: 'dev',
        executable: pythonExe,
        args: ['manage.py', 'runserver'],
        workingDir: context.root
      },
      {
        name: 'migrate',
        displayName: 'Django Migrate',
        description: 'Run Django database migrations',
        category: 'utils',
        executable: pythonExe,
        args: ['manage.py', 'migrate'],
        workingDir: context.root
      },
      {
        name: 'makemigrations',
        displayName: 'Django Make Migrations',
        description: 'Create new Django migrations',
        category: 'utils',
        executable: pythonExe,
        args: ['manage.py', 'makemigrations'],
        workingDir: context.root
      }
    ];
  }

  /**
   * Get Flask-specific commands
   */
  private getFlaskCommands(context: ProjectContext, pythonExe: string): Command[] {
    return [
      {
        name: 'flask-run',
        displayName: 'Flask Dev Server',
        description: 'Run Flask development server',
        category: 'dev',
        executable: 'flask',
        args: ['run'],
        env: { FLASK_APP: 'app.py' },
        workingDir: context.root
      }
    ];
  }  /**
   * Get FastAPI-specific commands
   */
  private getFastAPICommands(context: ProjectContext, pythonExe: string): Command[] {
    return [
      {
        name: 'fastapi-dev',
        displayName: 'FastAPI Dev Server',
        description: 'Run FastAPI with auto-reload',
        category: 'dev',
        executable: 'uvicorn',
        args: ['main:app', '--reload'],
        workingDir: context.root
      }
    ];
  }

  /**
   * Get package manager commands
   */
  private getPackageManagerCommands(context: ProjectContext, manager: string): Command[] {
    const commands: Command[] = [];

    switch (manager) {
      case 'pip':
        if (process.platform === 'win32') {
          // Use py -m pip on Windows for better compatibility
          commands.push({
            name: 'install',
            displayName: 'Install Dependencies',
            description: 'Install from requirements.txt',
            category: 'utils',
            executable: 'py',
            args: ['-m', 'pip', 'install', '-r', 'requirements.txt'],
            workingDir: context.root
          });
        } else {
          commands.push({
            name: 'install',
            displayName: 'Install Dependencies',
            description: 'Install from requirements.txt',
            category: 'utils',
            executable: 'pip',
            args: ['install', '-r', 'requirements.txt'],
            workingDir: context.root
          });
        }
        break;

      case 'poetry':
        commands.push({
          name: 'install',
          displayName: 'Poetry Install',
          description: 'Install dependencies with Poetry',
          category: 'utils',
          executable: 'poetry',
          args: ['install'],
          workingDir: context.root
        });
        break;

      case 'pipenv':
        commands.push({
          name: 'install',
          displayName: 'Pipenv Install',
          description: 'Install dependencies with Pipenv',
          category: 'utils',
          executable: 'pipenv',
          args: ['install'],
          workingDir: context.root
        });
        break;
    }

    return commands;
  }  /**
   * Get test commands
   */
  private getTestCommands(context: ProjectContext, pythonExe: string): Command[] {
    const commands: Command[] = [];

    // Pytest (most common)
    commands.push({
      name: 'test',
      displayName: 'Run Tests',
      description: 'Run tests with pytest',
      category: 'test',
      executable: pythonExe,
      args: ['-m', 'pytest'],
      workingDir: context.root
    });

    // Django tests
    if (context.frameworks?.includes('django')) {
      commands.push({
        name: 'django-test',
        displayName: 'Django Tests',
        description: 'Run Django tests',
        category: 'test',
        executable: pythonExe,
        args: ['manage.py', 'test'],
        workingDir: context.root
      });
    }

    return commands;
  }
}