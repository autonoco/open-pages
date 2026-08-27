import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';
import { DEV_SERVER_PORT } from '../../playwright.config.ts';

export { fixtureDir, prepareScratchProject } from '../scratch.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

export const devServerUrl = `http://127.0.0.1:${DEV_SERVER_PORT}`;

export const coreRoot = path.resolve(here, '..', '..');
export const coreBin = path.join(coreRoot, 'bin.js');
export const devScratchDir = path.join(coreRoot, 'e2e', '.scratch', 'dev');

export function docSourcePath(docId: string, projectDir = devScratchDir): string {
  return path.join(projectDir, 'docs', docId, 'index.tsx');
}

export function readDocSource(docId: string, projectDir = devScratchDir): Promise<string> {
  return fs.readFile(docSourcePath(docId, projectDir), 'utf8');
}

/** Rendered PDF pages in the viewer (one canvas per page). */
export function pdfPages(page: Page): Locator {
  return page.locator('main canvas');
}

/** Hit-test buttons the inspector overlays on the rendered pages. */
export function inspectBoxes(page: Page, tag?: string): Locator {
  return page.getByRole('button', { name: tag ? new RegExp(`^Inspect ${tag} at `) : /^Inspect / });
}

export function inspectToggle(page: Page): Locator {
  return page.getByRole('button', { name: 'Inspect', exact: true });
}

// The first render per page load waits on WASM init in the worker (several
// seconds cold). A doc duplicated moments earlier can also 404 until the docs
// virtual module refreshes (watcher debounce), and the server's full-reload
// broadcast can fire before this page's HMR socket connects — so retry with a
// reload.
export async function openDoc(page: Page, docId: string): Promise<void> {
  await page.goto(`/s/${docId}`);
  for (let attempt = 0; ; attempt++) {
    try {
      await expect(pdfPages(page).first()).toBeVisible({ timeout: 30_000 });
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
  await expect(inspectBoxes(page).first()).toBeVisible();
}

// The dev server's file watcher does not pick up newly created doc
// directories on Linux, so the docs virtual module stays stale after a doc
// is created on disk.
export async function refreshDocsModule(expectedDocId: string): Promise<void> {
  const watchedFile = docSourcePath('edit-target');
  await fs.writeFile(watchedFile, await fs.readFile(watchedFile, 'utf8'));
  await expect
    .poll(
      async () => {
        const res = await fetch(`${devServerUrl}/@id/__x00__virtual:open-pdf/docs`);
        return res.ok ? await res.text() : '';
      },
      { timeout: 15_000 },
    )
    .toContain(`"${expectedDocId}"`);
}

// Deleting first makes the call retry-safe: a CI retry that runs after a
// half-completed attempt would otherwise hit 409 "doc already exists".
export async function duplicateDoc(
  request: APIRequestContext,
  sourceId: string,
  newId: string,
): Promise<void> {
  await deleteDoc(request, newId);
  const res = await request.post(`/__docs/${sourceId}/duplicate`, { data: { newId } });
  expect(res.ok()).toBe(true);
  await refreshDocsModule(newId);
}

export async function deleteDoc(request: APIRequestContext, docId: string): Promise<void> {
  const res = await request.delete(`/__docs/${docId}`);
  expect(res.ok() || res.status() === 404, `delete ${docId} -> ${res.status()}`).toBe(true);
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
      env: { ...process.env, OPEN_PDF_SKIP_SKILLS_CHECK: '1' },
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
      reject(new Error(`open-pdf ${args.join(' ')} timed out after ${timeoutMs}ms\n${stderr}`));
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
    env: { ...process.env, OPEN_PDF_SKIP_SKILLS_CHECK: '1' },
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
