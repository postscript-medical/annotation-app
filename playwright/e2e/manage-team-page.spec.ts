import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

import { manage_team } from '../../src/constants/urls';

test.beforeEach(async ({ page }) => {
  await page.goto(`/#/${manage_team}`);
});

test('Load', async ({ page }) => {
  await expect(page.getByTestId("loading-overlay")).not.toBeVisible();

  await expect(page.getByRole("heading", { name: "Edit team" })).toBeVisible();

  await percySnapshot(page, 'Manage team page');
});