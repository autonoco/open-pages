import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateDocsModule } from './open-pdf-plugin.ts';

async function withDocsRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-pdf-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeDoc(root: string, id: string): Promise<string> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  const entry = path.join(root, id, 'index.tsx');
  await fs.writeFile(
    entry,
    `export const meta = { title: '${id}' };\nexport default [];\n`,
    'utf8',
  );
  return entry;
}

describe('generateDocsModule', () => {
  it('keeps docs whose id is ASCII-safe and reports none ignored', async () => {
    await withDocsRoot(async (root) => {
      const files = [await writeDoc(root, 'cover'), await writeDoc(root, 'intro_2')].sort();

      const { code, ignored } = await generateDocsModule(files, root, false);

      expect(ignored).toEqual([]);
      expect(code).toContain('export const docIds = ["cover","intro_2"];');
    });
  });

  it('excludes folders whose id is not ASCII-safe and reports them as ignored', async () => {
    await withDocsRoot(async (root) => {
      const files = [await writeDoc(root, 'cover'), await writeDoc(root, '推薦系統')].sort();

      const { code, ignored } = await generateDocsModule(files, root, false);

      expect(ignored).toEqual(['推薦系統']);
      expect(code).toContain('export const docIds = ["cover"];');
      expect(code).not.toContain('推薦系統');
    });
  });
});
