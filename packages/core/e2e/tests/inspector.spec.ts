import { expect, test } from '@playwright/test';
import {
  deletePage,
  duplicatePage,
  enableInspect,
  inspectToggle,
  openPage,
  pageFrame,
  readPageSource,
  selectInFrame,
} from './helpers.ts';

test.describe('inspector', () => {
  const createdPages: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdPages.splice(0)) {
      await deletePage(request, id);
    }
  });

  async function openEditable(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext,
    pageId: string,
  ) {
    createdPages.push(pageId);
    await duplicatePage(request, 'edit-target', pageId);
    await openPage(page, pageId, 'Editable headline');
  }

  test('inspect mode tags every source element and outlines the hovered one', async ({ page }) => {
    await openPage(page, 'edit-target', 'Editable headline');
    const frame = pageFrame(page);
    await expect(frame.locator('[data-op-loc]')).toHaveCount(3);

    await enableInspect(page);
    await frame.locator('h1').hover();
    const overlays = frame.locator('html > div[style*="position: fixed"]');
    await expect
      .poll(async () => {
        const boxes = await overlays.evaluateAll((els) =>
          els.map((el) => (el as HTMLElement).style.display),
        );
        return boxes.filter((d) => d === 'block').length;
      })
      .toBeGreaterThanOrEqual(1);
  });

  test('selecting an element shows its tag, source location, and text', async ({ page }) => {
    await openPage(page, 'edit-target', 'Editable headline');
    await enableInspect(page);
    await selectInFrame(page, 'h1');

    const source = await readPageSource('edit-target');
    const line = source.split('\n').findIndex((l) => l.includes('<h1')) + 1;
    expect(line).toBeGreaterThan(0);

    await expect(page.getByText('h1', { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`^line ${line}, col \\d+$`))).toBeVisible();
    await expect(page.getByText('“Editable headline”')).toBeVisible();
  });

  test('clicks in inspect mode never reach the page', async ({ page }) => {
    await openPage(page, 'pricing', 'Pricing headline');
    await enableInspect(page);
    const frame = pageFrame(page);
    await frame.getByRole('button', { name: 'Billed monthly' }).click();
    await expect(page.getByText('button', { exact: true })).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Billed monthly' })).toBeVisible();
  });

  test('saving a comment writes a marker into the page source', async ({ page, request }) => {
    await openEditable(page, request, 'insp-comment');
    await enableInspect(page);
    await selectInFrame(page, 'h1');

    const note = page.getByPlaceholder(/Leave a note for your agent/);
    const save = page.getByRole('button', { name: 'Save comment' });
    await expect(save).toBeDisabled();
    await note.fill('make the headline bigger');
    await expect(save).toBeEnabled();

    const posted = page.waitForResponse(
      (res) => res.url().includes('/__comments/add') && res.request().method() === 'POST',
    );
    await save.click();
    expect((await posted).status()).toBe(200);

    await expect(page.getByText('Comment saved — run /apply-comments to apply it')).toBeVisible();
    await expect(note).toHaveCount(0);
    await expect.poll(() => readPageSource('insp-comment')).toContain('@page-comment');
    const source = await readPageSource('insp-comment');
    const h1Line = source.split('\n').findIndex((l) => l.includes('<h1'));
    expect(source.split('\n')[h1Line + 1]).toContain('@page-comment');
    const list = (await (await request.get('/__comments/?pageId=insp-comment')).json()) as {
      comments: { note: string }[];
    };
    expect(list.comments.map((c) => c.note)).toEqual(['make the headline bigger']);
  });

  test('escape and the clear button dismiss the selection', async ({ page }) => {
    await openPage(page, 'edit-target', 'Editable headline');
    await enableInspect(page);

    await selectInFrame(page, 'h1');
    const note = page.getByPlaceholder(/Leave a note for your agent/);
    await page.keyboard.press('Escape');
    await expect(note).toHaveCount(0);

    await selectInFrame(page, 'p');
    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect(note).toHaveCount(0);
  });

  test('the i shortcut toggles inspect mode from the workspace and from the frame', async ({
    page,
  }) => {
    await openPage(page, 'edit-target', 'Editable headline');
    await expect(inspectToggle(page)).toBeEnabled({ timeout: 15_000 });

    await page.keyboard.press('i');
    await expect(inspectToggle(page)).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('i');
    await expect(inspectToggle(page)).toHaveAttribute('aria-pressed', 'false');

    await pageFrame(page).locator('body').click();
    await page.keyboard.press('i');
    await expect(inspectToggle(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('the selection is published to the agent cursor file', async ({ page }) => {
    await openPage(page, 'edit-target', 'Editable headline');
    await enableInspect(page);
    await selectInFrame(page, 'p');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const { devScratchDir } = await import('./helpers.ts');
    const file = path.join(devScratchDir, 'node_modules', '.open-pages', 'current.json');
    await expect
      .poll(async () => {
        try {
          return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .toMatchObject({
        pageId: 'edit-target',
        pageTitle: 'Edit Target',
        view: 'pages',
        pagePath: 'pages/edit-target/index.tsx',
        selection: { tagName: 'p', text: 'Editable body copy' },
      });
  });
});
