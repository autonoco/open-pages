import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { syncUi, UI_MANIFEST } from './sync-ui.ts';

async function withDirs<T>(fn: (ws: string, canonical: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-pages-syncui-'));
  const ws = path.join(root, 'ws');
  const canonical = path.join(root, 'canonical');
  await fs.mkdir(ws, { recursive: true });
  await fs.mkdir(canonical, { recursive: true });
  try {
    return await fn(ws, canonical);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function write(base: string, rel: string, content: string): Promise<void> {
  const abs = path.join(base, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf8');
}

const read = (base: string, rel: string) => fs.readFile(path.join(base, rel), 'utf8');

describe('syncUi', () => {
  it('adds missing files and records them in the manifest', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');
      await write(canonical, 'lib/utils.ts', 'cn');

      const result = await syncUi(ws, canonical);

      expect(result.added.sort()).toEqual(['lib/utils.ts', 'ui/button.tsx']);
      expect(await read(ws, 'ui/button.tsx')).toBe('v1');
      const manifest = JSON.parse(await read(ws, UI_MANIFEST)) as Record<string, string>;
      expect(Object.keys(manifest).sort()).toEqual(['lib/utils.ts', 'ui/button.tsx']);
    });
  });

  it('updates pristine files and keeps edited ones', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');
      await write(canonical, 'ui/card.tsx', 'v1');
      await syncUi(ws, canonical);

      await write(ws, 'ui/card.tsx', 'my edits');
      await write(canonical, 'ui/button.tsx', 'v2');
      await write(canonical, 'ui/card.tsx', 'v2');

      const result = await syncUi(ws, canonical);

      expect(result.updated).toEqual(['ui/button.tsx']);
      expect(result.skipped).toEqual(['ui/card.tsx']);
      expect(await read(ws, 'ui/button.tsx')).toBe('v2');
      expect(await read(ws, 'ui/card.tsx')).toBe('my edits');
    });
  });

  it('--force overwrites edited files', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');
      await syncUi(ws, canonical);
      await write(ws, 'ui/button.tsx', 'my edits');
      await write(canonical, 'ui/button.tsx', 'v2');

      const result = await syncUi(ws, canonical, { force: true });

      expect(result.forced).toEqual(['ui/button.tsx']);
      expect(await read(ws, 'ui/button.tsx')).toBe('v2');
    });
  });

  it('bootstraps without a manifest: matching files recorded, mismatched kept', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');
      await write(canonical, 'ui/card.tsx', 'v1');
      await write(ws, 'ui/button.tsx', 'v1');
      await write(ws, 'ui/card.tsx', 'older or edited');

      const result = await syncUi(ws, canonical);

      expect(result.unchanged).toEqual(['ui/button.tsx']);
      expect(result.skipped).toEqual(['ui/card.tsx']);
      expect(await read(ws, 'ui/card.tsx')).toBe('older or edited');
      const manifest = JSON.parse(await read(ws, UI_MANIFEST)) as Record<string, string>;
      expect(Object.keys(manifest)).toEqual(['ui/button.tsx']);
    });
  });

  it('reports files no longer shipped without deleting them', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');
      await write(canonical, 'ui/legacy.tsx', 'v1');
      await syncUi(ws, canonical);
      await fs.rm(path.join(canonical, 'ui/legacy.tsx'));

      const result = await syncUi(ws, canonical);

      expect(result.removedUpstream).toEqual(['ui/legacy.tsx']);
      expect(await read(ws, 'ui/legacy.tsx')).toBe('v1');
    });
  });

  it('adds missing workspace dependencies from deps.json', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');
      await write(
        canonical,
        'deps.json',
        JSON.stringify({ 'radix-ui': '^1.6.7', react: '^19.2.0' }),
      );
      await write(
        ws,
        'package.json',
        JSON.stringify({ name: 'x', dependencies: { react: '^19.2.0' } }),
      );

      const result = await syncUi(ws, canonical);

      expect(result.addedDeps).toEqual(['radix-ui']);
      const pkg = JSON.parse(await read(ws, 'package.json')) as {
        dependencies: Record<string, string>;
      };
      expect(pkg.dependencies['radix-ui']).toBe('^1.6.7');
    });
  });

  it('dry run reports but writes nothing', async () => {
    await withDirs(async (ws, canonical) => {
      await write(canonical, 'ui/button.tsx', 'v1');

      const result = await syncUi(ws, canonical, { dryRun: true });

      expect(result.added).toEqual(['ui/button.tsx']);
      await expect(read(ws, 'ui/button.tsx')).rejects.toThrow();
      await expect(read(ws, UI_MANIFEST)).rejects.toThrow();
    });
  });
});
