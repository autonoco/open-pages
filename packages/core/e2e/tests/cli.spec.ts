import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { coreRoot, fixtureDir, prepareScratchProject, runCli } from './helpers.ts';

test.describe('open-pages cli', () => {
  test('prints the package version', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(coreRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    const res = await runCli(['-v'], coreRoot, 30_000);
    expect(res.code).toBe(0);
    expect(res.stdout.trim()).toBe(pkg.version);
  });

  test('lists commands in help output', async () => {
    const res = await runCli(['--help'], coreRoot, 30_000);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('Start the dev server');
    expect(res.stdout).toContain('Build the workspace as a static site');
    expect(res.stdout).toContain('Preview the production build');
    expect(res.stdout).toContain('Build pages into self-contained static folders');
    expect(res.stdout).toContain('sync:skills');
  });

  test('rejects an invalid port', async () => {
    const res = await runCli(['dev', '-p', 'abc'], fixtureDir, 30_000);
    expect(res.code).toBe(1);
    expect(res.stderr).toContain('Invalid port: abc');
  });

  test('sync:skills copies the built-in skills into the workspace', async () => {
    const projectDir = prepareScratchProject('sync-skills');
    const res = await runCli(['sync:skills'], projectDir, 60_000);
    expect(res.code, res.stderr).toBe(0);
    const expected = [
      'apply-comments',
      'create-page',
      'create-theme',
      'current-page',
      'page-authoring',
      'shadcn',
    ];
    const agents = await fs.readdir(path.join(projectDir, '.agents', 'skills'));
    expect(agents.sort()).toEqual(expected);
    const claude = await fs.readdir(path.join(projectDir, '.claude', 'skills'));
    expect(claude.sort()).toEqual(expected);
    const link = await fs.lstat(path.join(projectDir, '.claude', 'skills', 'create-page'));
    expect(link.isSymbolicLink()).toBe(true);
    const skill = await fs.readFile(
      path.join(projectDir, '.claude', 'skills', 'create-page', 'SKILL.md'),
      'utf8',
    );
    expect(skill).toContain('name: create-page');
  });
});
