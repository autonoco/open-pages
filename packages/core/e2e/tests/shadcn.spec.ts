import { expect, test } from '@playwright/test';
import {
  deletePage,
  duplicatePage,
  enableInspect,
  openPage,
  pageFrame,
  readPageSource,
} from './helpers.ts';

const THEMED_PRIMARY = 'oklch(0.6 0.2 30)';
const DEFAULT_PRIMARY = 'oklch(0.205 0 0)';

test.describe('baked-in shadcn set', () => {
  test('pages compose ui/ components and pick up the page theme tokens', async ({ page }) => {
    await openPage(page, 'shadcn', 'Shadcn headline');
    const frame = pageFrame(page);
    const button = frame.getByRole('button', { name: 'Create account' });
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS('background-color', THEMED_PRIMARY);
    await expect(button).toHaveCSS('border-radius', '0px');

    await frame.getByRole('tab', { name: 'SSO' }).click();
    await expect(frame.getByRole('button', { name: 'Continue with SSO' })).toBeVisible();
  });

  test('pages without meta.theme keep the default tokens', async ({ page }) => {
    await openPage(page, 'pricing', 'Pricing headline');
    const button = pageFrame(page).getByRole('button', { name: 'Default primary' });
    await expect(button).toHaveCSS('background-color', DEFAULT_PRIMARY);
    await expect(button).not.toHaveCSS('border-radius', '0px');
  });

  test('the theme demo frame renders with the theme css', async ({ page }) => {
    await page.goto('/frame.html?theme=plain');
    const button = page.getByRole('button', { name: 'Themed button' });
    await expect(button).toBeVisible({ timeout: 30_000 });
    await expect(button).toHaveCSS('background-color', THEMED_PRIMARY);
  });
});

test.describe('inspector on components', () => {
  const createdPages: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdPages.splice(0)) {
      await deletePage(request, id);
    }
  });

  test('a click on <Button> resolves to the page line that rendered it', async ({ page }) => {
    await openPage(page, 'shadcn', 'Shadcn headline');
    const frame = pageFrame(page);
    const button = frame.getByRole('button', { name: 'Create account' });
    const source = await readPageSource('shadcn');
    const line = source.split('\n').findIndex((l) => l.includes('<Button type="submit"')) + 1;
    expect(line).toBeGreaterThan(0);
    await expect(button).toHaveAttribute('data-op-loc', new RegExp(`^${line}:\\d+$`));

    await enableInspect(page);
    await button.click();
    await expect(page.getByText('button', { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`^line ${line}, col \\d+$`))).toBeVisible();
    await expect(page.getByText('“Create account”')).toBeVisible();
  });

  test('a comment on <Button> lands as its first child', async ({ page, request }) => {
    createdPages.push('insp-button');
    await duplicatePage(request, 'shadcn', 'insp-button');
    await openPage(page, 'insp-button', 'Shadcn headline');
    await enableInspect(page);
    await pageFrame(page).getByRole('button', { name: 'Create account' }).click();

    const note = page.getByPlaceholder(/Leave a note for your agent/);
    await note.fill('make this button bigger');
    const posted = page.waitForResponse(
      (res) => res.url().includes('/__comments/add') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save comment' }).click();
    expect((await posted).status()).toBe(200);

    await expect.poll(() => readPageSource('insp-button')).toContain('@page-comment');
    const lines = (await readPageSource('insp-button')).split('\n');
    const buttonLine = lines.findIndex((l) => l.includes('<Button type="submit"'));
    expect(lines[buttonLine + 1]).toContain('@page-comment');
  });
});
