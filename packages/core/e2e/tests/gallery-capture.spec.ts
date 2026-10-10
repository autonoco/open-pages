import { expect, test } from '@playwright/test';

test('HTML capture becomes ready after a successful navigation', async ({ page }) => {
  await page.goto('/__documents?id=plain');
  await expect(page.locator('[data-document-ready]')).toHaveCount(1);
  await expect(page.locator('[data-document-error]')).toHaveCount(0);
  await expect(page.frameLocator('iframe').getByRole('heading')).toHaveText('Plain html headline');
});

for (const status of [404, 500]) {
  test(`HTML capture reports HTTP ${status} instead of becoming ready`, async ({ page }) => {
    await page.route('**/__page/plain/index.html', (route) =>
      route.fulfill({ status, contentType: 'text/html', body: '<h1>Navigation failed</h1>' }),
    );
    await page.goto('/__documents?id=plain');
    await expect(page.locator('[data-document-error]')).toHaveAttribute(
      'data-document-error',
      new RegExp(`HTTP ${status}`),
    );
    await expect(page.locator('[data-document-ready]')).toHaveCount(0);
  });
}

test('HTML capture reports a failed connection instead of becoming ready', async ({ page }) => {
  await page.route('**/__page/plain/index.html', (route) => route.abort('connectionfailed'));
  await page.goto('/__documents?id=plain');
  await expect(page.locator('[data-document-error]')).toHaveCount(1);
  await expect(page.locator('[data-document-ready]')).toHaveCount(0);
});

test('HTML capture rejects navigation to a different document', async ({ page }) => {
  await page.route('**/__page/plain/index.html', (route) =>
    route.fulfill({ status: 302, headers: { location: '/__documents' } }),
  );
  await page.goto('/__documents?id=plain');
  await expect(page.locator('[data-document-error]')).toHaveCount(1);
  await expect(page.locator('[data-document-ready]')).toHaveCount(0);
});

for (const type of ['op:ready', 'op:error']) {
  test(`capture receives ${type} posted immediately by the frame`, async ({ page }) => {
    await page.route('**/frame.html?page=alpha', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<script>parent.postMessage({type: '${type}', message: 'Early frame failure'}, location.origin)</script>`,
      }),
    );
    await page.goto('/__documents?id=alpha');
    if (type === 'op:ready') {
      await expect(page.locator('[data-document-ready]')).toHaveCount(1);
      await expect(page.locator('[data-document-error]')).toHaveCount(0);
    } else {
      await expect(page.locator('[data-document-error]')).toHaveAttribute(
        'data-document-error',
        'Early frame failure',
      );
      await expect(page.locator('[data-document-ready]')).toHaveCount(0);
    }
  });
}
