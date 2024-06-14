import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

import { LegalLinks } from './shared/legal-links';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Verify page elements', async ({ page }) => {
  const legalLinks = new LegalLinks(page);

  await expect(page).toHaveTitle(/PostScript Medical/);

  await legalLinks.verifyLinks();

  await percySnapshot(page, 'Login page');
});

test('Verify the reset password modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Forgot your password?'}).click();

  await expect(page.getByText('Request a recovery password email')).toBeVisible();

  await percySnapshot(page, 'Forgot your password modal');
});

test('Login with credentials', async ({ page, baseURL }) => {
  await page.getByLabel('Email').fill(process.env.TEST_USERNAME || '');

  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || '');

  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(baseURL + '#/annotate');

  await expect(page.getByText('loading')).not.toBeVisible();

  await percySnapshot(page, 'Login using UI');
});