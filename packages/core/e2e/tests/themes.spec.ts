import { expect, test } from '@playwright/test';

test.describe('themes', () => {
  test('gallery lists fixture themes with a live demo and opens the detail page', async ({
    page,
  }) => {
    await page.goto('/themes');
    await expect(page.getByText('Plain').first()).toBeVisible();
    await expect(page.getByText('Minimal fixture theme for e2e tests.')).toBeVisible();
    await expect(
      page.frameLocator('li iframe[src="/frame.html?theme=plain"]').locator('h1'),
    ).toHaveText('Theme demo', { timeout: 30_000 });

    await page.getByRole('button', { name: 'Open theme Plain' }).click();
    await expect(page).toHaveURL(/\/themes\/plain$/);
    await expect(page.getByRole('heading', { name: 'Plain' })).toBeVisible();
    await expect(
      page.frameLocator('iframe[src="/frame.html?theme=plain"]').first().locator('h1'),
    ).toHaveText('Theme demo', { timeout: 30_000 });
  });

  test('detail page lists the pages using the theme and links back', async ({ page }) => {
    await page.goto('/themes/plain');
    await expect(page.getByText('Pages using this theme')).toBeVisible();
    await expect(page.getByText('Alpha Page')).toBeVisible();

    await page.getByRole('button', { name: 'Back to themes' }).click();
    await expect(page).toHaveURL(/\/themes$/);
  });
});
