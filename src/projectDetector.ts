/**
 * Project Detector
 * Intelligent project type and context detection
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { ProjectContext, ProjectType, PackageManager, Framework } from './types.js';

export { ProjectContext } from './types.js';

export class ProjectDetector {
  /**
   * Find the project root by looking for common project markers
   */
  async findProjectRoot(startPath: string): Promise<string> {
    let currentPath = path.resolve(startPath);
    const root = path.parse(currentPath).root;

    while (currentPath !== root) {
      // Check for project markers
      const markers = [
        'package.json',
        'requirements.txt',
        'pyproject.toml',
        'Pipfile',
        '.git',
        'setup.py',
        'Cargo.toml',
        'go.mod'
      ];

      for (const marker of markers) {
        try {
          await fs.access(path.join(currentPath, marker));
          return currentPath;
        } catch {
          // Continue searching
        }
      }

      // Move up one directory
      currentPath = path.dirname(currentPath);
    }

    // No project root found, return original path
    return startPath;
  }
  /**
   * Detect project type and context
   */
  async detectProject(projectRoot: string): Promise<ProjectContext> {
    const context: ProjectContext = {
      root: projectRoot,
      type: [],
      packageManagers: [],
      frameworks: [],
      metadata: {}
    };

    // Run all detections in parallel
    const [nodeResult, pythonResult] = await Promise.all([
      this.detectNodeProject(projectRoot, context),
      this.detectPythonProject(projectRoot, context)
    ]);

    // Determine if polyglot
    if (context.type.length > 1) {
      context.type.push('polyglot');
    }

    // Default to unknown if no type detected
    if (context.type.length === 0) {
      context.type.push('unknown');
    }

    return context;
  }

  /**
   * Detect Node.js project characteristics
   */
  private async detectNodeProject(root: string, context: ProjectContext): Promise<boolean> {
    try {
      // Check for package.json
      const packageJsonPath = path.join(root, 'package.json');
      await fs.access(packageJsonPath);
      
      context.type.push('node');
      
      // Read package.json
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      if (!context.metadata) {
        context.metadata = {};
      }
      context.metadata.packageJson = JSON.parse(packageJsonContent);

      // Detect package managers
      await this.detectNodePackageManagers(root, context);
      
      // Detect frameworks
      await this.detectNodeFrameworks(context);

      return true;
    } catch {
      return false;
    }
  }  /**
   * Detect Node.js package managers
   */
  private async detectNodePackageManagers(root: string, context: ProjectContext): Promise<void> {
    // Check for lock files in priority order
    const managers: Array<[string, PackageManager]> = [
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['package-lock.json', 'npm']
    ];

    for (const [lockFile, manager] of managers) {
      try {
        await fs.access(path.join(root, lockFile));
        context.packageManagers.push(manager);
        break; // Use first found
      } catch {
        // Continue checking
      }
    }

    // Default to npm if no lock file found
    if (context.packageManagers.length === 0 && context.type.includes('node')) {
      context.packageManagers.push('npm');
    }
  }

  /**
   * Detect Node.js frameworks
   */
  private async detectNodeFrameworks(context: ProjectContext): Promise<void> {
    if (!context.metadata?.packageJson) return;

    const deps = {
      ...(context.metadata.packageJson.dependencies || {}),
      ...(context.metadata.packageJson.devDependencies || {})
    };

    if (deps.next) context.frameworks!.push('next');
    if (deps.react) context.frameworks!.push('react');
    if (deps.vue) context.frameworks!.push('vue');
    if (deps.express) context.frameworks!.push('express');
  }  /**
   * Detect Python project characteristics
   */
  private async detectPythonProject(root: string, context: ProjectContext): Promise<boolean> {
    const pythonMarkers = [
      'requirements.txt',
      'setup.py',
      'pyproject.toml',
      'Pipfile',
      'environment.yml',
      'conda.yml'
    ];

    let isPython = false;
    for (const marker of pythonMarkers) {
      try {
        await fs.access(path.join(root, marker));
        isPython = true;
        break;
      } catch {
        // Continue checking
      }
    }

    if (!isPython) return false;

    context.type.push('python');

    // Detect virtual environment
    await this.detectPythonVirtualEnv(root, context);

    // Detect package managers
    await this.detectPythonPackageManagers(root, context);

    // Detect frameworks
    await this.detectPythonFrameworks(root, context);

    return true;
  }

  /**
   * Detect Python virtual environment
   */
  private async detectPythonVirtualEnv(root: string, context: ProjectContext): Promise<void> {
    const venvNames = ['venv', 'env', '.venv', 'virtualenv'];
    
    for (const venvName of venvNames) {
      try {
        const venvPath = path.join(root, venvName);
        const stats = await fs.stat(venvPath);
        if (stats.isDirectory()) {
          // Check for pyvenv.cfg to confirm it's a venv
          await fs.access(path.join(venvPath, 'pyvenv.cfg'));
          context.virtualEnv = venvName;
          break;
        }
      } catch {
        // Continue checking
      }
    }
  }  /**
   * Detect Python package managers
   */
  private async detectPythonPackageManagers(root: string, context: ProjectContext): Promise<void> {
    // Check for package manager files
    const managers: Array<[string, PackageManager]> = [
      ['poetry.lock', 'poetry'],
      ['Pipfile.lock', 'pipenv'],
      ['requirements.txt', 'pip']
    ];

    for (const [file, manager] of managers) {
      try {
        await fs.access(path.join(root, file));
        context.packageManagers.push(manager);
        break; // Use first found
      } catch {
        // Continue checking
      }
    }

    // Check pyproject.toml for poetry
    try {
      const pyprojectPath = path.join(root, 'pyproject.toml');
      const content = await fs.readFile(pyprojectPath, 'utf-8');
      if (content.includes('[tool.poetry]')) {
        if (!context.packageManagers.includes('poetry')) {
          context.packageManagers.push('poetry');
        }
      }
    } catch {
      // Ignore
    }

    // Default to pip if no package manager found
    if (context.packageManagers.length === 0 && context.type.includes('python')) {
      context.packageManagers.push('pip');
    }
  }

  /**
   * Detect Python frameworks
   */
  private async detectPythonFrameworks(root: string, context: ProjectContext): Promise<void> {
    // Check for Django
    try {
      await fs.access(path.join(root, 'manage.py'));
      context.frameworks!.push('django');
    } catch {
      // Not Django
    }

    // Check requirements.txt for frameworks
    try {
      const reqPath = path.join(root, 'requirements.txt');
      const content = await fs.readFile(reqPath, 'utf-8');
      const lines = content.toLowerCase().split('\n');
      
      if (lines.some(line => line.startsWith('flask'))) {
        context.frameworks!.push('flask');
      }
      if (lines.some(line => line.startsWith('fastapi'))) {
        context.frameworks!.push('fastapi');
      }
      if (lines.some(line => line.startsWith('django'))) {
        if (!context.frameworks!.includes('django')) {
          context.frameworks!.push('django');
        }
      }
    } catch {
      // No requirements.txt
    }

    // Check for Flask app.py pattern
    try {
      const appPath = path.join(root, 'app.py');
      const content = await fs.readFile(appPath, 'utf-8');
      if (content.includes('from flask import') || content.includes('import flask')) {
        if (!context.frameworks!.includes('flask')) {
          context.frameworks!.push('flask');
        }
      }
    } catch {
      // No app.py
    }
  }
}