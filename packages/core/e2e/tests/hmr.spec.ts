import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  devScratchDir,
  docSourcePath,
  enableInspect,
  inspectBoxes,
  openDoc,
  pdfPages,
  refreshDocsModule,
} from './helpers.ts';

const FRESH_DOC = `import type { DocMeta } from '@autono/open-pdf';

export const meta: DocMeta = {
  title: 'Fresh Doc',
  createdAt: '2026-01-05T00:00:00.000Z',
};

export default function Fresh() {
  return (
    <main tw="flex flex-col">
      <h1 tw="text-[32px] font-bold">Fresh page</h1>
    </main>
  );
}
`;

test.describe('dev server file watching', () => {
  test('editing a doc source re-renders the open doc', async ({ page }) => {
    const file = docSourcePath('hot-swap');
    const source = await fs.readFile(file, 'utf8');
    try {
      await openDoc(page, 'hot-swap');
      await enableInspect(page);
      await expect(inspectBoxes(page, 'p')).toHaveCount(1);

      await fs.writeFile(
        file,
        source.replace(
          '<p tw="mt-4">Hot swap body copy</p>',
          '<p tw="mt-4">Hot swap body copy</p>\n      <p tw="mt-4">Hot swapped in</p>',
        ),
      );

      await expect(inspectBoxes(page, 'p')).toHaveCount(2, { timeout: 20_000 });
    } finally {
      await fs.writeFile(file, source);
    }
  });

  test('a doc created on disk appears after a refresh and hot-disappears when removed', async ({
    page,
  }) => {
    const dir = path.join(devScratchDir, 'docs', 'hmr-doomed');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.tsx'), FRESH_DOC);
      await refreshDocsModule('hmr-doomed');

      await page.goto('/');
      const card = page.getByText('Fresh Doc');
      try {
        await expect(card).toBeVisible({ timeout: 10_000 });
      } catch {
        await page.reload();
        await expect(card).toBeVisible({ timeout: 15_000 });
      }

      // Removal is watched live: the server broadcasts a full reload and the
      // open page drops the card without manual navigation.
      await fs.rm(dir, { recursive: true, force: true });
      await expect(card).toBeHidden({ timeout: 15_000 });
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('a doc that does not export a component shows the render error', async ({ page }) => {
    const dir = path.join(devScratchDir, 'docs', 'hmr-broken');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, 'index.tsx'),
        "export const meta = { title: 'Broken Doc' };\nexport default 42;\n",
      );
      await refreshDocsModule('hmr-broken');

      await page.goto('/s/hmr-broken');
      const banner = page.getByText('Doc module must default-export a component');
      try {
        await expect(banner).toBeVisible({ timeout: 15_000 });
      } catch {
        await page.reload();
        await expect(banner).toBeVisible({ timeout: 30_000 });
      }
      await expect(pdfPages(page)).toHaveCount(0);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
