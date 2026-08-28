import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  devScratchDir,
  openPage,
  pageFrame,
  pageSourcePath,
  refreshPagesModule,
  settlePageRemoval,
} from './helpers.ts';

const FRESH_PAGE = `import type { PageMeta } from '@autono/open-pages';

export const meta: PageMeta = {
  title: 'Fresh Page',
  createdAt: '2026-01-05T00:00:00.000Z',
};

export default function Fresh() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">Fresh page</h1>
    </main>
  );
}
`;

test.describe('dev server file watching', () => {
  test('editing a page source re-renders the frame without reloading the workspace', async ({
    page,
  }) => {
    const file = pageSourcePath('hot-swap');
    const source = await fs.readFile(file, 'utf8');
    try {
      await openPage(page, 'hot-swap', 'Hot swap headline');
      // Let a full-reload queued by an earlier test's page deletion land first;
      // the stamp below proves this document survives the edit itself.
      await page.waitForTimeout(2_000);
      await page.evaluate(() => {
        (window as unknown as { __opStamp: number }).__opStamp = 42;
      });
      const frame = pageFrame(page);
      await expect(frame.locator('p')).toHaveCount(1);

      await fs.writeFile(
        file,
        source.replace(
          '<p className="mt-4">Hot swap body copy</p>',
          '<p className="mt-4">Hot swap body copy</p>\n      <p className="mt-4">Hot swapped in</p>',
        ),
      );

      await expect(frame.getByText('Hot swapped in')).toBeVisible({ timeout: 20_000 });
      await expect(frame.locator('p')).toHaveCount(2);
      expect(
        await page.evaluate(() => (window as unknown as { __opStamp?: number }).__opStamp),
      ).toBe(42);
    } finally {
      await fs.writeFile(file, source);
    }
  });

  test('editing an html page reloads its frame', async ({ page }) => {
    const file = path.join(devScratchDir, 'pages', 'plain', 'index.html');
    const source = await fs.readFile(file, 'utf8');
    try {
      await page.goto('/p/plain');
      const frame = pageFrame(page);
      await expect(frame.getByRole('heading', { name: 'Plain html headline' })).toBeVisible({
        timeout: 30_000,
      });

      await fs.writeFile(file, source.replace('Plain html headline', 'Plain html swapped'));
      await expect(frame.getByRole('heading', { name: 'Plain html swapped' })).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await fs.writeFile(file, source);
    }
  });

  test('a page created on disk appears after a refresh and hot-disappears when removed', async ({
    page,
  }) => {
    const dir = path.join(devScratchDir, 'pages', 'hmr-doomed');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.tsx'), FRESH_PAGE);
      await refreshPagesModule('hmr-doomed');

      await page.goto('/');
      const card = page.getByText('Fresh Page');
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
      await settlePageRemoval('hmr-doomed');
    }
  });

  test('a page that does not export a component shows the render error', async ({ page }) => {
    const dir = path.join(devScratchDir, 'pages', 'hmr-broken');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, 'index.tsx'),
        "export const meta = { title: 'Broken Page' };\nexport default 42;\n",
      );
      await refreshPagesModule('hmr-broken');

      await page.goto('/p/hmr-broken');
      const banner = page.getByText('must default-export a component').first();
      try {
        await expect(banner).toBeVisible({ timeout: 15_000 });
      } catch {
        await page.reload();
        await expect(banner).toBeVisible({ timeout: 30_000 });
      }
      await expect(page.getByRole('button', { name: 'Inspect', exact: true })).toBeDisabled();
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
      await settlePageRemoval('hmr-broken');
    }
  });
});
