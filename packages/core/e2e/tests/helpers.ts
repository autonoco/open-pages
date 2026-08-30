import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type APIRequestContext,
  expect,
  type FrameLocator,
  type Locator,
  type Page,
} from '@playwright/test';
import { DEV_SERVER_PORT } from '../../playwright.config.ts';

export { fixtureDir, prepareScratchProject } from '../scratch.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

export const devServerUrl = `http://127.0.0.1:${DEV_SERVER_PORT}`;

export const coreRoot = path.resolve(here, '..', '..');
export const coreBin = path.join(coreRoot, 'bin.js');
export const devScratchDir = path.join(coreRoot, 'e2e', '.scratch', 'dev');

export function pageSourcePath(pageId: string, projectDir = devScratchDir): string {
  return path.join(projectDir, 'pages', pageId, 'index.tsx');
}

export function readPageSource(pageId: string, projectDir = devScratchDir): Promise<string> {
  return fs.readFile(pageSourcePath(pageId, projectDir), 'utf8');
}

/** The iframe the viewer renders the page into. */
export function pageFrame(page: Page): FrameLocator {
  return page.frameLocator('main iframe');
}

export function inspectToggle(page: Page): Locator {
  return page.getByRole('button', { name: 'Inspect', exact: true });
}

// A page duplicated moments earlier can 404 until the pages virtual module
// refreshes (watcher debounce), and the server's full-reload broadcast can
// fire before this page's HMR socket connects — so retry with a reload.
export async function openPage(page: Page, pageId: string, heading?: string): Promise<void> {
  await page.goto(`/p/${pageId}`);
  for (let attempt = 0; ; attempt++) {
    try {
      const frame = pageFrame(page);
      const target = heading ? frame.getByRole('heading', { name: heading }) : frame.locator('h1');
      await expect(target.first()).toBeVisible({ timeout: 30_000 });
      return;
    } catch (err) {
      if (attempt >= 2) throw err;
      await page.reload();
    }
  }
}

export async function enableInspect(page: Page): Promise<void> {
  const toggle = inspectToggle(page);
  await expect(toggle).toBeEnabled({ timeout: 15_000 });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  // The frame flips into inspect mode on a postMessage; clicking before it
  // lands goes to the page instead of the inspector.
  await expect
    .poll(() =>
      pageFrame(page)
        .locator('html')
        .evaluate((el) => el.style.cursor),
    )
    .toBe('crosshair');
}

/** Selects an element inside the frame while inspect mode is on. */
export async function selectInFrame(page: Page, selector: string): Promise<void> {
  await pageFrame(page).locator(selector).first().click();
  await expect(page.getByPlaceholder(/Leave a note for your agent/)).toBeVisible();
}

// The dev server's file watcher does not pick up newly created page
// directories on Linux, so the pages virtual module stays stale after a page
// is created on disk.
export async function refreshPagesModule(expectedPageId: string): Promise<void> {
  const watchedFile = pageSourcePath('edit-target');
  await fs.writeFile(watchedFile, await fs.readFile(watchedFile, 'utf8'));
  await expect
    .poll(
      async () => {
        const res = await fetch(`${devServerUrl}/@id/__x00__virtual:open-pages/pages`);
        return res.ok ? await res.text() : '';
      },
      { timeout: 15_000 },
    )
    .toContain(`"${expectedPageId}"`);
}

// Deleting first makes the call retry-safe: a CI retry that runs after a
// half-completed attempt would otherwise hit 409 "page already exists".
export async function duplicatePage(
  request: APIRequestContext,
  sourceId: string,
  newId: string,
): Promise<void> {
  await deletePage(request, newId);
  const res = await request.post(`/__pages/${sourceId}/duplicate`, { data: { newId } });
  expect(res.ok()).toBe(true);
  await refreshPagesModule(newId);
}

export async function deletePage(request: APIRequestContext, pageId: string): Promise<void> {
  const res = await request.delete(`/__pages/${pageId}`);
  expect(res.ok() || res.status() === 404, `delete ${pageId} -> ${res.status()}`).toBe(true);
  if (!res.ok()) return;
  await settlePageRemoval(pageId);
}

// A removed page entry lands through the watcher a beat later and broadcasts
// a full reload; wait it out so it cannot reset the next test's UI mid-flight.
export async function settlePageRemoval(pageId: string): Promise<void> {
  await expect
    .poll(
      async () => {
        const mod = await fetch(`${devServerUrl}/@id/__x00__virtual:open-pages/pages`);
        return mod.ok ? await mod.text() : '';
      },
      { timeout: 15_000 },
    )
    .not.toContain(`"${pageId}"`);
  await new Promise((r) => setTimeout(r, 600));
}

export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export function runCli(args: string[], cwd: string, timeoutMs = 180_000): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [coreBin, ...args], {
      cwd,
      env: { ...process.env, OPEN_PAGES_SKIP_SKILLS_CHECK: '1' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`open-pages ${args.join(' ')} timed out after ${timeoutMs}ms\n${stderr}`));
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

export function startCliServer(args: string[], cwd: string): ChildProcess {
  return spawn(process.execPath, [coreBin, ...args], {
    cwd,
    stdio: 'ignore',
    env: { ...process.env, OPEN_PAGES_SKIP_SKILLS_CHECK: '1' },
  });
}

export async function waitForHttpOk(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server at ${url} never became ready: ${String(lastError)}`);
}

export async function stopServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.killed) return;
  const exited = new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
  });
  child.kill('SIGTERM');
  await Promise.race([exited, new Promise((r) => setTimeout(r, 5_000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// Module scripts refuse to load from file:// URLs, so exported folders are
// checked through a throwaway static server.
export async function serveStatic(
  dir: string,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname);
    const file = path.join(dir, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
    try {
      const body = await fs.readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
