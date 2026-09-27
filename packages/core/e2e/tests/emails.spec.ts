import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { devScratchDir, pageFrame, prepareScratchProject, runCli } from './helpers.ts';

test.describe('emails', () => {
  test('the gallery lists the fixture email with its subject', async ({ page }) => {
    await page.goto('/emails');
    await expect(page.getByRole('heading', { name: 'Emails' })).toBeVisible();
    const card = page.getByRole('link', { name: 'Open email Welcome Email' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Welcome to the fixture')).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/e\/welcome$/);
  });

  test('the viewer renders the email, its text alternative, and the raw document', async ({
    page,
    request,
  }) => {
    await page.goto('/e/welcome');
    await expect(page).toHaveTitle('Welcome Email — Autono');
    const frame = pageFrame(page);
    await expect(frame.getByRole('heading', { name: 'Welcome headline' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(frame.getByRole('link', { name: 'Get started' })).toHaveAttribute(
      'href',
      'https://example.com/start',
    );

    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect
      .poll(async () => (await page.locator('main iframe').boundingBox())?.width)
      .toBe(375);

    await page.getByRole('button', { name: 'Text' }).click();
    await expect(page.locator('main pre')).toContainText('WELCOME HEADLINE');
    await expect(page.locator('main pre')).toContainText('Get started https://example.com/start');

    const raw = await request.get('/__email/welcome/index.html?raw');
    expect(raw.ok()).toBe(true);
    const html = await raw.text();
    expect(html).toContain('Fixture preheader');
    expect(html).not.toContain('data-op-loc');
    expect(html).not.toContain('email-inspect');
    expect(html).toContain('background-color:rgb(17,17,17)');

    const report = await request.get('/__email/welcome/index.json');
    expect(await report.json()).toEqual({
      title: 'Welcome Email',
      subject: 'Welcome to the fixture',
      unresolved: [],
    });
  });

  test('editing the email re-renders the frame', async ({ page }) => {
    const file = path.join(devScratchDir, 'emails', 'welcome', 'index.tsx');
    const original = await fs.readFile(file, 'utf8');
    try {
      await page.goto('/e/welcome');
      const frame = pageFrame(page);
      await expect(frame.getByRole('heading', { name: 'Welcome headline' })).toBeVisible({
        timeout: 30_000,
      });
      await fs.writeFile(file, original.replace('Welcome headline', 'Edited headline'), 'utf8');
      await expect(frame.getByRole('heading', { name: 'Edited headline' })).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await fs.writeFile(file, original, 'utf8');
    }
  });

  test('inspector comments land in the email source', async ({ page }) => {
    const file = path.join(devScratchDir, 'emails', 'welcome', 'index.tsx');
    const original = await fs.readFile(file, 'utf8');
    try {
      await page.goto('/e/welcome');
      const frame = pageFrame(page);
      await expect(frame.getByRole('heading', { name: 'Welcome headline' })).toBeVisible({
        timeout: 30_000,
      });
      const toggle = page.getByRole('button', { name: 'Inspect', exact: true });
      await expect(toggle).toBeEnabled({ timeout: 15_000 });
      await toggle.click();
      await expect
        .poll(() => frame.locator('html').evaluate((el) => el.style.cursor))
        .toBe('crosshair');
      await frame.getByRole('heading', { name: 'Welcome headline' }).click();
      await page.getByPlaceholder(/Leave a note for your agent/).fill('make this warmer');
      await page.getByRole('button', { name: 'Save comment' }).click();
      await expect
        .poll(async () => (await fs.readFile(file, 'utf8')).includes('@page-comment'))
        .toBe(true);
      const edited = await fs.readFile(file, 'utf8');
      expect(edited).toContain('text="eyJub3RlIjoibWFrZSB0aGlzIHdhcm1lciJ9"');
    } finally {
      await fs.writeFile(file, original, 'utf8');
    }
  });
});

test.describe('email export', () => {
  test('writes the rendered html and text for an email id', async () => {
    test.setTimeout(300_000);
    const projectDir = prepareScratchProject('export-email');
    const res = await runCli(['export', 'welcome'], projectDir);
    expect(res.code, res.stderr).toBe(0);
    expect(res.stdout).toContain('export/emails/welcome/');
    expect(res.stdout).toContain('1 email');
    expect(existsSync(path.join(projectDir, 'export', 'alpha'))).toBe(false);

    const dir = path.join(projectDir, 'export', 'emails', 'welcome');
    const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
    expect(html).toContain('Welcome headline');
    expect(html).toContain('background-color:rgb(17,17,17)');
    expect(html).not.toContain('data-op-loc');
    expect(html).not.toContain('<script');
    const text = await fs.readFile(path.join(dir, 'index.txt'), 'utf8');
    expect(text).toContain('WELCOME HEADLINE');
    expect(text).toContain('https://example.com/start');
  });
});
