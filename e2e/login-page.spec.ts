import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(/PostScript Medical/);
  });
  
  test('T&Cs link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute("href", "https://www.postscriptmedical.com/terms-of-use/");
  });

  test('Privacy link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute("href", "https://www.postscriptmedical.com/privacy-policy/");
  });
});
