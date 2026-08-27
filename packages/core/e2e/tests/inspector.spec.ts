import { expect, test } from '@playwright/test';
import {
  deleteDoc,
  duplicateDoc,
  enableInspect,
  inspectBoxes,
  inspectToggle,
  openDoc,
  readDocSource,
} from './helpers.ts';

test.describe('inspector', () => {
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
    await openDoc(page, docId);
  }

  test('inspect mode overlays a hit box per source element', async ({ page }) => {
    await openDoc(page, 'edit-target');
    await enableInspect(page);
    await expect(inspectBoxes(page, 'h1')).toHaveCount(1);
    await expect(inspectBoxes(page, 'p')).toHaveCount(1);
  });

  test('selecting an element shows its tag, source location, and text', async ({ page }) => {
    await openDoc(page, 'edit-target');
    await enableInspect(page);
    await inspectBoxes(page, 'h1').click();

    const source = await readDocSource('edit-target');
    const line = source.split('\n').findIndex((l) => l.includes('<h1')) + 1;
    expect(line).toBeGreaterThan(0);

    await expect(page.getByText('h1', { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`^line ${line}, col \\d+$`))).toBeVisible();
    await expect(page.getByText('Editable headline')).toBeVisible();
    await expect(page.getByPlaceholder(/Leave a note for your agent/)).toBeVisible();
  });

  test('saving a comment writes a marker into the doc source', async ({ page, request }) => {
    await openEditable(page, request, 'insp-comment');
    await enableInspect(page);
    await inspectBoxes(page, 'h1').click();

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
    await expect.poll(() => readDocSource('insp-comment')).toContain('@pdf-comment');
    const list = (await (await request.get('/__comments/?docId=insp-comment')).json()) as {
      comments: { note: string }[];
    };
    expect(list.comments.map((c) => c.note)).toEqual(['make the headline bigger']);
  });

  test('escape and the clear button dismiss the selection', async ({ page }) => {
    await openDoc(page, 'edit-target');
    await enableInspect(page);

    await inspectBoxes(page, 'h1').click();
    const note = page.getByPlaceholder(/Leave a note for your agent/);
    await expect(note).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(note).toHaveCount(0);

    await inspectBoxes(page, 'p').click();
    await expect(note).toBeVisible();
    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect(note).toHaveCount(0);
  });

  test('the i shortcut toggles inspect mode', async ({ page }) => {
    await openDoc(page, 'edit-target');
    await expect(inspectToggle(page)).toBeEnabled({ timeout: 15_000 });

    await page.keyboard.press('i');
    await expect(inspectToggle(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(inspectBoxes(page).first()).toBeVisible();

    await page.keyboard.press('i');
    await expect(inspectToggle(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(inspectBoxes(page)).toHaveCount(0);
  });
});
