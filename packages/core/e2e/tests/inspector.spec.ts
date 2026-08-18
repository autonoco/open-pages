import { expect, test } from '@playwright/test';
import { deleteDoc, duplicateDoc, editorCanvas, openPdf, readDocSource } from './helpers.ts';

test.describe('inspector editing', () => {
  const createdDocs: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdDocs.splice(0)) {
      await deleteDoc(request, id);
    }
  });

  async function openEditable(
    page: import('@playwright/test').Page,
    request: import('@playwright/test').APIRequestContext,
    docId: string,
  ) {
    createdDocs.push(docId);
    await duplicateDoc(request, 'edit-target', docId);
    await openPdf(page, docId);
  }

  test('selecting an element opens the panel with its tag and text', async ({ page, request }) => {
    await openEditable(page, request, 'insp-select');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();

    const panel = page.locator('aside[data-inspector-ui]');
    await expect(panel).toBeVisible();
    await expect(panel.getByText('<h1>')).toBeVisible();
    await expect(panel.getByPlaceholder('Element text')).toHaveValue('Editable headline');
  });

  test('saving a text edit rewrites the doc source on disk', async ({ page, request }) => {
    await openEditable(page, request, 'insp-save');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();

    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Edited via inspector');
    await expect(editorCanvas(page).getByText('Edited via inspector')).toBeVisible();
    await expect(page.getByText('1 unsaved change')).toBeVisible();

    const saved = page.waitForResponse(
      (res) => res.url().includes('/__edit') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save' }).click();
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readDocSource('insp-save')).toContain('Edited via inspector');
  });

  test('discard reverts the edit without touching the file', async ({ page, request }) => {
    await openEditable(page, request, 'insp-discard');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();

    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Discarded text');
    await expect(editorCanvas(page).getByText('Discarded text')).toBeVisible();

    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(editorCanvas(page).getByText('Editable headline')).toBeVisible();
    expect(await readDocSource('insp-discard')).not.toContain('Discarded text');
  });

  test('toggling the inspector off commits pending edits', async ({ page, request }) => {
    await openEditable(page, request, 'insp-commit');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable body copy').click();

    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Committed body copy');

    const saved = page.waitForResponse(
      (res) => res.url().includes('/__edit') && res.request().method() === 'POST',
    );
    await page.getByTitle('Inspect').click();
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readDocSource('insp-commit')).toContain('Committed body copy');
  });

  test('style toggles restyle the element live and save to disk', async ({ page, request }) => {
    await openEditable(page, request, 'insp-style');
    await page.getByTitle('Inspect').click();
    const headline = editorCanvas(page).getByText('Editable headline');
    await headline.click();

    const panel = page.locator('aside[data-inspector-ui]');
    const bold = panel.getByRole('button', { name: 'Bold' });
    const italic = panel.getByRole('button', { name: 'Italic' });
    await bold.click();
    await italic.click();
    await panel.getByRole('button', { name: 'center', exact: true }).click();
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await expect(headline).toHaveCSS('font-weight', '700');
    await expect(headline).toHaveCSS('font-style', 'italic');
    await expect(headline).toHaveCSS('text-align', 'center');

    const saved = page.waitForResponse(
      (res) => res.url().includes('/__edit') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save' }).click();
    expect((await saved).status()).toBe(200);
    await expect.poll(() => readDocSource('insp-style')).toContain('textAlign');
    const src = await readDocSource('insp-style');
    expect(src).toContain('fontWeight');
    expect(src).toContain('fontStyle');
  });

  test('undo and redo step through an inspector edit', async ({ page, request }) => {
    await openEditable(page, request, 'insp-undo');
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByText('Editable headline').click();
    await page.locator('aside[data-inspector-ui]').getByPlaceholder('Element text').fill('Undo me');
    await expect(editorCanvas(page).getByText('Undo me')).toBeVisible();

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(editorCanvas(page).getByText('Editable headline')).toBeVisible();

    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(editorCanvas(page).getByText('Undo me')).toBeVisible();
  });

  test('the i shortcut toggles inspect mode', async ({ page, request }) => {
    await openEditable(page, request, 'insp-key');
    await page.keyboard.press('i');
    await editorCanvas(page).getByText('Editable headline').click();
    await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
  });
});
