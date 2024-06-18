import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

import { annotate } from '../../src/constants/urls';

test.beforeEach(async ({ page }) => {
  await page.goto(`/#/${annotate}`);
});

test('Load', async ({ page }) => {
  await expect(page.getByTestId("loading-overlay")).not.toBeVisible();

  await expect(page.getByText("Feedback")).toBeVisible();

  await percySnapshot(page, 'Image annotation page');
});