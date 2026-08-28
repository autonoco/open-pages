import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { duplicatePageDir, updateMetaTitleInSource, validatePageName } from './page-ops.ts';

async function withDocsRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-pages-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeDoc(root: string, id: string, title = id): Promise<void> {
  await fs.mkdir(path.join(root, id, 'assets'), { recursive: true });
  await fs.writeFile(
    path.join(root, id, 'index.tsx'),
    `export const meta = { title: '${title}' };\nexport default [];\n`,
    'utf8',
  );
  await fs.writeFile(path.join(root, id, 'assets', 'hero.txt'), 'hero', 'utf8');
}

describe('duplicatePageDir', () => {
  it('duplicates a page directory with an automatic copy id', async () => {
    await withDocsRoot(async (root) => {
      await writeDoc(root, 'cover', 'Cover');

      const result = await duplicatePageDir(root, 'cover');

      expect(result).toEqual({ ok: true, pageId: 'cover-copy' });
      await expect(fs.readFile(path.join(root, 'cover-copy', 'index.tsx'), 'utf8')).resolves.toBe(
        `export const meta = { title: 'Cover (copy)' };\nexport default [];\n`,
      );
      await expect(
        fs.readFile(path.join(root, 'cover-copy', 'assets', 'hero.txt'), 'utf8'),
      ).resolves.toBe('hero');
    });
  });

  it('increments the automatic copy id when a copy already exists', async () => {
    await withDocsRoot(async (root) => {
      await writeDoc(root, 'cover');

      expect(await duplicatePageDir(root, 'cover')).toEqual({ ok: true, pageId: 'cover-copy' });
      expect(await duplicatePageDir(root, 'cover')).toEqual({
        ok: true,
        pageId: 'cover-copy-2',
      });
    });
  });

  it('rejects source page ids with bad characters', async () => {
    await withDocsRoot(async (root) => {
      expect(await duplicatePageDir(root, 'bad id')).toMatchObject({ ok: false, status: 400 });
    });
  });

  it('rejects an existing desired id', async () => {
    await withDocsRoot(async (root) => {
      await writeDoc(root, 'cover');
      await writeDoc(root, 'target');

      expect(await duplicatePageDir(root, 'cover', 'target')).toMatchObject({
        ok: false,
        status: 409,
      });
    });
  });

  it('rejects path traversal in the source page id', async () => {
    await withDocsRoot(async (root) => {
      expect(await duplicatePageDir(root, '..')).toMatchObject({ ok: false, status: 400 });
    });
  });

  it('returns not found when the source page does not exist', async () => {
    await withDocsRoot(async (root) => {
      expect(await duplicatePageDir(root, 'missing')).toMatchObject({ ok: false, status: 404 });
    });
  });
});

describe('validatePageName', () => {
  it('accepts longer page names than folder names', () => {
    expect(validatePageName('x'.repeat(80))).toBe('x'.repeat(80));
    expect(validatePageName('x'.repeat(81))).toBeNull();
  });

  it('rejects empty input', () => {
    expect(validatePageName('')).toBeNull();
    expect(validatePageName('   ')).toBeNull();
  });
});

describe('updateMetaTitleInSource', () => {
  it('replaces an existing single-quoted title literal', () => {
    const source = `export const meta: PageMeta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
    expect(out).not.toContain("'old'");
  });

  it('replaces an existing double-quoted title literal', () => {
    const source = `export const meta = { title: "old" };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
  });

  it('escapes single quotes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, "it's new");
    expect(out).toContain("title: 'it\\'s new'");
  });

  it('escapes backslashes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'a\\b');
    expect(out).toContain("title: 'a\\\\b'");
  });

  it('injects a title into a meta object that lacks one', () => {
    const source = `export const meta = {\n  notes: 'x',\n};\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'first');
    expect(out).toMatch(/title:\s*'first'/);
    expect(out).toContain("notes: 'x'");
  });

  it('injects a fresh meta export when none exists', () => {
    const source = `export default [];\n`;
    const out = updateMetaTitleInSource(source, 'fresh');
    expect(out).toContain("export const meta: PageMeta = { title: 'fresh' };");
    expect(out).toContain('export default []');
  });

  it('returns null if there is no meta and no default export', () => {
    expect(updateMetaTitleInSource('// nothing here', 'x')).toBeNull();
  });
});
