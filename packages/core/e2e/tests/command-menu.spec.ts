import { expect, test } from '@playwright/test';

test.describe('command menu', () => {
  test('opens on the home page and jumps to a doc', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open command menu' })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');

    const input = page.getByPlaceholder('Search docs or run a command');
    await expect(input).toBeVisible();

    await input.fill('tables');
    await page.getByRole('option', { name: 'Tables Doc' }).click();
    await expect(page).toHaveURL(/\/s\/tables$/);
  });

  test('trigger button opens the menu and Escape closes it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open command menu' }).click();

    const input = page.getByPlaceholder('Search docs or run a command');
    await expect(input).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(input).toBeHidden();
  });

  test('switches theme from the shared appearance group', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open command menu' })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByPlaceholder('Search docs or run a command').fill('theme dark');
    await page.getByRole('option', { name: 'Theme: Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
