import { expect, test } from '@playwright/test';
import { deleteDoc, duplicateDoc, openPdf, readDocSource } from './helpers.ts';

test.describe('design panel', () => {
  test('shuffling and saving writes a design declaration to disk', async ({ page, request }) => {
    try {
      await duplicateDoc(request, 'edit-target', 'design-ui');
      await openPdf(page, 'design-ui');

      await page.keyboard.press('d');
      const shuffle = page.getByRole('button', { name: 'Shuffle design' });
      await expect(shuffle).toBeVisible();
      await shuffle.click();

      const saved = page.waitForResponse(
        (res) => res.url().includes('/__design') && res.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Save' }).click();
      expect((await saved).status()).toBe(200);
      await expect.poll(() => readDocSource('design-ui')).toContain('const design');
    } finally {
      await deleteDoc(request, 'design-ui');
    }
  });
});
