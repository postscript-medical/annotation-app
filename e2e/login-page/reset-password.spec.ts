import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Reset password', () => {
  test('Verify the reset password modal', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Forgot your password?'}).click();

    await percySnapshot(page, 'Forgot your password modal');
  });

  test('Verify the enter new password modal', async ({ page }) => {
    await page.route('/.netlify/identity/verify', (route) => {
      route.fulfill({
        body: 'All good'
      })
    });

    await page.goto('/#recovery_token=3nYODsNWv_ogD5ncla7OCw');

    await percySnapshot(page, 'Verifing user token modal');
  });
});
