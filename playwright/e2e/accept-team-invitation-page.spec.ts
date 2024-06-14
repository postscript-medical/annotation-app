import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

import { LegalLinks } from './shared/legal-links';
import { accept_team_invitation } from '../../src/constants/urls';

test('Load', async ({ page }) => {
  const legalLinks = new LegalLinks(page);

  await page.goto(`/#/${accept_team_invitation}/?token=token_value`);

  await expect(page.getByRole('heading', { name: 'Welcome to PostScript'})).toBeVisible();

  await legalLinks.verifyLinks();

  await percySnapshot(page, 'Accept team invitation');
});

test('Redirect to login when token missing', async ({ page }) => {
  await page.goto(`/#/${accept_team_invitation}`);

  await expect(page.getByRole('heading', { name: 'Sign in'})).toBeVisible();

  await percySnapshot(page, 'Accept team invitation - Missing token');
});

/**
 * TODO: 
 * - Verify successful submission
 * - Verify error from server on submission
 * - Verify invalid password
 * - Verify mismatched password
 */
