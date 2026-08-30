import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findPages,
  generatePagesModule,
  pagesSignature,
  rewriteHtmlUrls,
} from './open-pages-plugin.ts';

async function withPagesRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-pages-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeReactPage(root: string, id: string): Promise<void> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  await fs.writeFile(
    path.join(root, id, 'index.tsx'),
    `export const meta = { title: '${id}', createdAt: '2026-01-02T00:00:00.000Z' };\nexport default function Page() { return null; }\n`,
    'utf8',
  );
}

async function writeHtmlPage(root: string, id: string, title: string): Promise<void> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  await fs.writeFile(
    path.join(root, id, 'index.html'),
    `<!doctype html><html><head><title>${title}</title></head><body></body></html>`,
    'utf8',
  );
}

describe('findPages', () => {
  it('discovers react and html entries and prefers react when both exist', async () => {
    await withPagesRoot(async (root) => {
      await writeReactPage(root, 'cover');
      await writeHtmlPage(root, 'legacy', 'Legacy');
      await writeReactPage(root, 'both');
      await writeHtmlPage(root, 'both', 'Both');

      const entries = await findPages(path.dirname(root), path.basename(root));

      expect(entries.map((e) => [e.id, e.kind])).toEqual([
        ['both', 'react'],
        ['cover', 'react'],
        ['legacy', 'html'],
      ]);
    });
  });
});

describe('pagesSignature', () => {
  it('changes when a page entry is replaced by a same-kind file with another extension', async () => {
    await withPagesRoot(async (root) => {
      await writeReactPage(root, 'cover');
      const before = pagesSignature(await findPages(path.dirname(root), path.basename(root)));

      await fs.rename(path.join(root, 'cover', 'index.tsx'), path.join(root, 'cover', 'index.jsx'));
      const after = pagesSignature(await findPages(path.dirname(root), path.basename(root)));

      expect(after).not.toBe(before);
    });
  });
});

describe('generatePagesModule', () => {
  it('keeps pages whose id is ASCII-safe and reports none ignored', async () => {
    await withPagesRoot(async (root) => {
      await writeReactPage(root, 'cover');
      await writeReactPage(root, 'intro_2');
      const entries = await findPages(path.dirname(root), path.basename(root));

      const { code, ignored } = await generatePagesModule(entries, false);

      expect(ignored).toEqual([]);
      expect(code).toContain('export const pageIds = ["cover","intro_2"];');
      expect(code).toContain('export const pageKinds = {"cover":"react","intro_2":"react"};');
      expect(code).toContain('"cover":1767312000000');
    });
  });

  it('excludes folders whose id is not ASCII-safe and reports them as ignored', async () => {
    await withPagesRoot(async (root) => {
      await writeReactPage(root, 'cover');
      await writeReactPage(root, '推薦系統');
      const entries = await findPages(path.dirname(root), path.basename(root));

      const { code, ignored } = await generatePagesModule(entries, false);

      expect(ignored).toEqual(['推薦系統']);
      expect(code).toContain('export const pageIds = ["cover"];');
      expect(code).not.toContain('推薦系統');
    });
  });

  it('resolves html pages to a static module carrying the <title>', async () => {
    await withPagesRoot(async (root) => {
      await writeHtmlPage(root, 'legacy', 'Legacy Landing');
      const entries = await findPages(path.dirname(root), path.basename(root));

      const { code } = await generatePagesModule(entries, true);

      expect(code).toContain('export const pageKinds = {"legacy":"html"};');
      expect(code).toContain(
        'case "legacy": return Promise.resolve({"meta":{"title":"Legacy Landing"}});',
      );
      expect(code).not.toContain('pageImportTokens["legacy"]');
    });
  });
});

describe('rewriteHtmlUrls', () => {
  it('points relative src/href at the page folder through /@fs and leaves absolute urls alone', () => {
    const html =
      '<link href="./style.css"><script src="main.ts"></script><a href="https://x.y/">x</a><img src="/abs.png"><a href="#top">t</a>';
    expect(rewriteHtmlUrls(html, '/work/pages/legacy')).toBe(
      '<link href="/@fs/work/pages/legacy/style.css"><script src="/@fs/work/pages/legacy/main.ts"></script><a href="https://x.y/">x</a><img src="/abs.png"><a href="#top">t</a>',
    );
  });
});
