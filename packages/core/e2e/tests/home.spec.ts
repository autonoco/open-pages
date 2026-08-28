import { expect, test } from '@playwright/test';
import { pageFrame } from './helpers.ts';

test.describe('home page browser', () => {
  test('lists every fixture page with its display title and a live thumbnail', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li h3')).toHaveCount(5);
    for (const title of ['Alpha Page', 'Pricing Page', 'Edit Target', 'Hot Page', 'Plain HTML']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(page.locator('li iframe')).toHaveCount(5);
    const thumb = page.locator('li iframe').first();
    await expect(thumb).toHaveAttribute('src', /frame\.html\?page=/);
    await expect(
      page.frameLocator('li iframe[src="/frame.html?page=alpha"]').locator('h1'),
    ).toHaveText('Alpha headline', { timeout: 30_000 });
  });

  test('page card links to the viewer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Alpha Page' }).click();
    await expect(page).toHaveURL(/\/p\/alpha$/);
    await expect(pageFrame(page).locator('h1').first()).toBeVisible({ timeout: 30_000 });
  });

  test('search filters pages and can be cleared', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Search pages');
    await search.fill('pricing');
    await expect(page.locator('li h3')).toHaveCount(1);
    await expect(page.getByText('Pricing Page')).toBeVisible();

    await search.fill('zzz-no-match');
    await expect(page.getByText('No matches')).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).first().click();
    await expect(page.locator('li h3')).toHaveCount(5);
  });

  test('sort control reorders pages by created date', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('li h3').first()).toHaveText('Alpha Page');
    await page.getByRole('button', { name: /^Sort:/ }).click();
    await page.getByRole('menuitem', { name: 'Oldest' }).click();
    // The html page has no createdAt and sorts before every dated page.
    await expect(page.locator('li h3').first()).toHaveText('Plain HTML');
    await expect(page.locator('li h3').nth(1)).toHaveText('Hot Page');
  });

  test('page theme badge links to the theme page', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('li', { hasText: 'Alpha Page' })
      .getByRole('link', { name: 'plain', exact: true })
      .click();
    await expect(page).toHaveURL(/\/themes\/plain$/);
    await expect(page.getByText('Plain').first()).toBeVisible();
  });

  test('theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('language toggle switches locale and persists across reloads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: '繁體中文' }).click();
    await expect(page.getByPlaceholder('Search pages')).toHaveCount(0);
    await expect(page.getByText(/頁面|投影片/).first()).toBeVisible();

    await page.reload();
    await expect(page.getByPlaceholder('Search pages')).toHaveCount(0);
    await expect(page.getByText(/頁面|投影片/).first()).toBeVisible();
  });

  test('sidebar toolbar buttons label themselves on hover', async ({ page }) => {
    await page.goto('/');
    const tooltip = page.locator('[data-slot="tooltip-content"]').last();
    // A single move lands without the pointer ever resting, which is what the
    // tooltip waits for.
    for (const [name, label] of [
      ['Open command menu', 'Search'],
      ['Change language', 'Language'],
      ['Toggle theme', 'Theme'],
    ]) {
      const box = await page.getByRole('button', { name }).boundingBox();
      if (!box) throw new Error(`${name} has no bounding box`);
      await page.mouse.move(box.x + box.width / 2 - 2, box.y + box.height / 2 - 2);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect(tooltip).toContainText(label);
    }
  });

  test('unknown routes render the not-found page', async ({ page }) => {
    await page.goto('/definitely-not-a-route');
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('folders can be created and deleted from the sidebar', async ({ page, request }) => {
    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'New folder' }).click();
      const input = page.getByPlaceholder('Folder name');
      await input.fill('Sidebar Folder');
      await expect(input).toHaveValue('Sidebar Folder');
      const created = page.waitForResponse(
        (res) => res.url().includes('/__folders') && res.request().method() === 'POST',
      );
      await input.press('Enter');
      expect((await created).status()).toBe(200);

      // "Folder actions" only exists on real folder rows, so its presence proves
      // the new folder rendered in the sidebar (the name alone also matches the
      // success toast).
      const actions = page.getByRole('button', { name: 'Folder actions' });
      await expect(actions).toBeVisible();
      await actions.click();
      // The menu keeps repositioning while the card thumbnails behind it
      // load, so Playwright never sees it "stable"; the item is interactable.
      const remove = page.getByRole('menuitem', { name: 'Delete' });
      await expect(remove).toBeVisible();
      await remove.click({ force: true });
      await expect(actions).toHaveCount(0);
    } finally {
      // The sidebar delete rewrites the manifest; a read racing that write can
      // fail once, so poll until the endpoint answers cleanly.
      const folders = await expect
        .poll(async () => {
          try {
            const body = (await (await request.get('/__folders')).json()) as {
              folders: { id: string }[];
            };
            return body.folders;
          } catch {
            return null;
          }
        })
        .not.toBeNull()
        .then(async () => {
          const body = (await (await request.get('/__folders')).json()) as {
            folders: { id: string }[];
          };
          return body.folders;
        });
      for (const folder of folders) await request.delete(`/__folders/${folder.id}`);
    }
  });
});
