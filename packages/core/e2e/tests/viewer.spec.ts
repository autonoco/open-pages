import { expect, test } from '@playwright/test';
import { inspectToggle, openPage, pageFrame } from './helpers.ts';

test.describe('page viewer', () => {
  test('renders the page in a frame with its title in the header and tab', async ({ page }) => {
    await openPage(page, 'alpha', 'Alpha headline');
    await expect(page.getByRole('heading', { name: 'Alpha Page' })).toBeVisible();
    await expect(pageFrame(page).getByText('Opening content')).toBeVisible();
    await expect(page).toHaveTitle('Alpha Page — open-pages');
  });

  test('viewport toggles resize the frame and persist across reloads', async ({ page }) => {
    await openPage(page, 'alpha');
    const frame = page.locator('main iframe');
    const full = await frame.boundingBox();
    expect(full?.width).toBeGreaterThan(900);

    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect(page.getByRole('button', { name: 'Mobile' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(async () => (await frame.boundingBox())?.width).toBe(390);

    await page.getByRole('button', { name: 'Tablet' }).click();
    await expect.poll(async () => (await frame.boundingBox())?.width).toBe(820);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Tablet' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(async () => (await frame.boundingBox())?.width).toBe(820);

    await page.getByRole('button', { name: 'Desktop' }).click();
    await expect.poll(async () => (await frame.boundingBox())?.width).toBeGreaterThan(900);
  });

  test('pages are interactive inside the frame', async ({ page }) => {
    await openPage(page, 'pricing', 'Pricing headline');
    const frame = pageFrame(page);
    await expect(frame.getByText('$49', { exact: true })).toBeVisible();
    await frame.getByRole('button', { name: 'Billed monthly' }).click();
    await expect(frame.getByText('$490', { exact: true })).toBeVisible();
  });

  test('the reload button remounts the frame', async ({ page }) => {
    await openPage(page, 'pricing', 'Pricing headline');
    const frame = pageFrame(page);
    await frame.getByRole('button', { name: 'Billed monthly' }).click();
    await expect(frame.getByRole('button', { name: 'Billed yearly' })).toBeVisible();

    await page.getByRole('button', { name: 'Reload page' }).click();
    await expect(frame.getByRole('button', { name: 'Billed monthly' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('open link points at the standalone frame url', async ({ page }) => {
    await openPage(page, 'alpha');
    const link = page.getByRole('link', { name: 'Open page in a new tab' });
    await expect(link).toHaveAttribute('href', '/frame.html?page=alpha');
    await expect(link).toHaveAttribute('target', '_blank');

    await page.goto('/frame.html?page=alpha');
    await expect(page.getByRole('heading', { name: 'Alpha headline' })).toBeVisible();
    await expect(page).toHaveTitle('Alpha Page');
  });

  test('the inspect toggle enables once the frame is ready', async ({ page }) => {
    await openPage(page, 'alpha');
    await expect(inspectToggle(page)).toBeEnabled({ timeout: 15_000 });
    await expect(inspectToggle(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('html pages render through the page middleware with an html badge', async ({ page }) => {
    await page.goto('/p/plain');
    const frame = pageFrame(page);
    await expect(frame.getByRole('heading', { name: 'Plain html headline' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('html', { exact: true })).toBeVisible();
    await expect(page.locator('main iframe')).toHaveAttribute('src', '/__page/plain/index.html');
    await expect(inspectToggle(page)).toHaveCount(0);

    // Sibling css and js resolve relative to the page folder.
    await expect(frame.locator('body')).toHaveCSS('background-color', 'rgb(255, 250, 240)');
    await frame.getByRole('button', { name: 'Clicked 0 times' }).click();
    await expect(frame.getByRole('button', { name: 'Clicked 1 time' })).toBeVisible();
  });

  test('unknown page ids surface an error instead of loading forever', async ({ page }) => {
    await page.goto('/p/does-not-exist');
    await expect(page.getByText('Page not found: does-not-exist')).toBeVisible();
    await expect(page.locator('main iframe')).toHaveCount(0);
    await expect(page.getByText('Loading')).toHaveCount(0);
  });

  test('back link returns to the page browser', async ({ page }) => {
    await openPage(page, 'alpha');
    await page.getByRole('link', { name: 'Back to pages' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('li h3')).toHaveCount(6);
  });
});
