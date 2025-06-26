/**
 * Project Detector Tests
 * Tests for intelligent project type and context detection
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ProjectDetector, ProjectContext } from '../src/projectDetector.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('ProjectDetector', () => {
  let tempDir: string;
  let detector: ProjectDetector;
  
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `detector-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    detector = new ProjectDetector();
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('findProjectRoot', () => {
    it('should find project root by package.json', async () => {
      const subDir = path.join(tempDir, 'src', 'components');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, 'package.json'), '{}');
      
      const root = await detector.findProjectRoot(subDir);
      expect(root).toBe(tempDir);
    });

    it('should find project root by requirements.txt', async () => {
      const subDir = path.join(tempDir, 'src', 'modules');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0');
      
      const root = await detector.findProjectRoot(subDir);
      expect(root).toBe(tempDir);
    });

    it('should find project root by .git directory', async () => {
      const subDir = path.join(tempDir, 'lib');
      await fs.mkdir(subDir, { recursive: true });
      await fs.mkdir(path.join(tempDir, '.git'), { recursive: true });
      
      const root = await detector.findProjectRoot(subDir);
      expect(root).toBe(tempDir);
    });

    it('should return current dir when no project markers found', async () => {
      const root = await detector.findProjectRoot(tempDir);
      expect(root).toBe(tempDir);
    });
  });

  describe('detectNodeProject', () => {
    it('should detect npm as package manager', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{}');
      
      const context = await detector.detectProject(tempDir);
      expect(context.type).toContain('node');
      expect(context.packageManagers).toContain('npm');
    });

    it('should detect yarn as package manager', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');
      
      const context = await detector.detectProject(tempDir);
      expect(context.packageManagers).toContain('yarn');
    });

    it('should detect pnpm as package manager', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');
      
      const context = await detector.detectProject(tempDir);
      expect(context.packageManagers).toContain('pnpm');
    });
  });

  describe('detectPythonProject', () => {
    it('should detect poetry project', async () => {
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), '[tool.poetry]');
      await fs.writeFile(path.join(tempDir, 'poetry.lock'), '');
      
      const context = await detector.detectProject(tempDir);
      expect(context.type).toContain('python');
      expect(context.packageManagers).toContain('poetry');
    });

    it('should detect pipenv project', async () => {
      await fs.writeFile(path.join(tempDir, 'Pipfile'), '');
      await fs.writeFile(path.join(tempDir, 'Pipfile.lock'), '{}');
      
      const context = await detector.detectProject(tempDir);
      expect(context.packageManagers).toContain('pipenv');
    });

    it('should detect Django project', async () => {
      await fs.writeFile(path.join(tempDir, 'manage.py'), '#!/usr/bin/env python');
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'django==4.0.0');
      
      const context = await detector.detectProject(tempDir);
      expect(context.frameworks).toContain('django');
    });

    it('should detect Flask project', async () => {
      await fs.writeFile(path.join(tempDir, 'app.py'), 'from flask import Flask');
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0');
      
      const context = await detector.detectProject(tempDir);
      expect(context.frameworks).toContain('flask');
    });
  });

  describe('detectPolyglotProject', () => {
    it('should detect both Node.js and Python in same project', async () => {
      // Node.js indicators
      await fs.writeFile(path.join(tempDir, 'package.json'), '{}');
      
      // Python indicators
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0');
      await fs.writeFile(path.join(tempDir, 'app.py'), 'from flask import Flask');
      
      const context = await detector.detectProject(tempDir);
      expect(context.type).toContain('node');
      expect(context.type).toContain('python');
      expect(context.type).toContain('polyglot');
    });
  });
});