import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  pageFrame,
  prepareScratchProject,
  runCli,
  serveStatic,
  startCliServer,
  stopServer,
  waitForHttpOk,
} from './helpers.ts';

const FLAGS_CONFIG = `import type { OpenPagesConfig } from '@autono/open-pages';

const openPagesConfig: OpenPagesConfig = {
  build: { showPageBrowser: false, showPageUi: false },
};

export default openPagesConfig;
`;

test.describe('static build and preview', () => {
  const port = 43119;
  const baseUrl = `http://127.0.0.1:${port}`;
  let projectDir: string;
  let preview: ChildProcess | undefined;

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    projectDir = prepareScratchProject('build');
    const res = await runCli(['build'], projectDir);
    expect(res.code, res.stderr).toBe(0);
    preview = startCliServer(
      ['preview', '--host', '127.0.0.1', '--port', String(port)],
      projectDir,
    );
    await waitForHttpOk(`${baseUrl}/`);
  });

  test.afterAll(async () => {
    if (preview) await stopServer(preview);
  });

  test('emits the workspace, the page frame, and per-page chunks', async () => {
    const dist = path.join(projectDir, 'dist');
    const entries = await fs.readdir(dist);
    expect(entries.filter((name) => name.endsWith('.html')).sort()).toEqual([
      'frame.html',
      'index.html',
    ]);

    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<title>open-pages</title>');

    // Each react page is lazily imported, so it code-splits into at least one
    // chunk per page plus the two entries. Chunk names depend on the bundler,
    // so assert the split happened rather than pinning a naming convention.
    const reactPageCount = 5;
    const assets = await fs.readdir(path.join(dist, 'assets'));
    const jsChunks = assets.filter((name) => name.endsWith('.js'));
    expect(jsChunks.length).toBeGreaterThanOrEqual(reactPageCount + 2);

    // HTML pages are built into the spot the viewer's frame url points at.
    const plain = await fs.readFile(path.join(dist, '__page', 'plain', 'index.html'), 'utf8');
    expect(plain).toContain('Plain html headline');
    expect(plain).not.toContain('/@fs/');
  });

  test('serves the page browser from the static bundle', async ({ page }) => {
    await page.goto(`${baseUrl}/`);
    await expect(page.getByText('Alpha Page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Pricing Page')).toBeVisible();
  });

  test('deep links resolve through the spa fallback and render the frame', async ({ page }) => {
    await page.goto(`${baseUrl}/p/alpha`);
    await expect(pageFrame(page).getByRole('heading', { name: 'Alpha headline' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: 'Inspect', exact: true })).toHaveCount(0);
  });

  test('html pages render from the static bundle', async ({ page }) => {
    await page.goto(`${baseUrl}/p/plain`);
    const frame = pageFrame(page);
    await expect(frame.getByRole('heading', { name: 'Plain html headline' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(frame.locator('body')).toHaveCSS('background-color', 'rgb(255, 250, 240)');
  });

  test('dev-only endpoints fall through to the spa fallback in preview', async ({ request }) => {
    const res = await request.get(`${baseUrl}/__server-status`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
  });
});

test.describe('build flags', () => {
  const port = 43121;
  const baseUrl = `http://127.0.0.1:${port}`;
  let preview: ChildProcess | undefined;

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    const projectDir = prepareScratchProject('build-flags');
    await fs.writeFile(path.join(projectDir, 'open-pages.config.ts'), FLAGS_CONFIG);
    const res = await runCli(['build'], projectDir);
    expect(res.code, res.stderr).toBe(0);
    preview = startCliServer(
      ['preview', '--host', '127.0.0.1', '--port', String(port)],
      projectDir,
    );
    await waitForHttpOk(`${baseUrl}/`);
  });

  test.afterAll(async () => {
    if (preview) await stopServer(preview);
  });

  test('showPageBrowser false hides the home browser', async ({ page }) => {
    await page.goto(`${baseUrl}/`);
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('showPageUi false serves a bare read-only viewer', async ({ page }) => {
    await page.goto(`${baseUrl}/p/alpha`);
    await expect(pageFrame(page).getByRole('heading', { name: 'Alpha headline' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Inspect', exact: true })).toHaveCount(0);
  });
});

test.describe('export', () => {
  let projectDir: string;

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    projectDir = prepareScratchProject('export');
    const res = await runCli(['export', 'alpha', 'plain'], projectDir);
    expect(res.code, res.stderr).toBe(0);
    expect(res.stdout).toContain('export/alpha/');
    expect(res.stdout).toContain('export/plain/');
    expect(res.stdout).toContain('2 pages');
  });

  test('react pages become a self-contained folder with relative asset urls', async ({ page }) => {
    const dir = path.join(projectDir, 'export', 'alpha');
    const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
    expect(html).toContain('<title>Alpha Page</title>');
    expect(html).toContain('<meta name="description" content="Alpha fixture landing page." />');
    expect(html).toMatch(/src="\.\/assets\/[^"]+\.js"/);
    expect(html).toMatch(/href="\.\/assets\/[^"]+\.css"/);
    expect(html).not.toContain('entry.tsx');
    expect(existsSync(path.join(projectDir, 'export', 'pricing'))).toBe(false);

    const served = await serveStatic(dir);
    try {
      await page.goto(`${served.url}/`);
      await expect(page.getByRole('heading', { name: 'Alpha headline' })).toBeVisible();
      await expect(page.locator('h1')).toHaveCSS('font-weight', '700');
    } finally {
      await served.close();
    }
  });

  test('html pages become a self-contained folder too', async ({ page }) => {
    const dir = path.join(projectDir, 'export', 'plain');
    const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
    expect(html).toContain('<title>Plain HTML</title>');
    expect(html).not.toContain('/@fs/');

    const served = await serveStatic(dir);
    try {
      await page.goto(`${served.url}/`);
      await expect(page.getByRole('heading', { name: 'Plain html headline' })).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 250, 240)');
    } finally {
      await served.close();
    }
  });

  test('unknown page ids fail with the available ids', async () => {
    const res = await runCli(['export', 'nope'], projectDir, 60_000);
    expect(res.code).toBe(1);
    expect(res.stderr).toContain('Page not found: nope');
    expect(res.stderr).toContain('alpha');
  });
});

test.describe('export with shadcn', () => {
  test('a themed shadcn page exports with its components and theme css', async ({ page }) => {
    test.setTimeout(300_000);
    const projectDir = prepareScratchProject('export-shadcn');
    const res = await runCli(['export', 'shadcn'], projectDir);
    expect(res.code, res.stderr).toBe(0);

    const dir = path.join(projectDir, 'export', 'shadcn');
    const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
    expect(html).toContain('<title>Shadcn Page</title>');

    const served = await serveStatic(dir);
    try {
      await page.goto(`${served.url}/`);
      const button = page.getByRole('button', { name: 'Create account' });
      await expect(button).toBeVisible();
      await expect(button).toHaveCSS('background-color', 'oklch(0.6 0.2 30)');
      await expect(button).toHaveCSS('border-radius', '0px');
      await page.getByRole('tab', { name: 'SSO' }).click();
      await expect(page.getByRole('button', { name: 'Continue with SSO' })).toBeVisible();
    } finally {
      await served.close();
    }
  });
});
