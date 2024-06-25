import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('Hash-based url', async ({ page}) => {
  await page.goto('/#/does-not-exist');

  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Page not found'})).toBeVisible();

  await percySnapshot(page, 'Page not found - hashed');
});

test('Non hash-based url', async ({ page }) => {
  test.skip(process.env.CONTEXT === "dev", "Netlify only redirects deployed urls");

  await page.goto('/does-not-exist');

  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Page not found'})).toBeVisible();

  await percySnapshot(page, 'Page not found - not hashed');
});