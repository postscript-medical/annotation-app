import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Email').fill(process.env.TEST_USERNAME || '');
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || '');
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait until the page reaches a state where all cookies are set.
  await expect(page.getByTestId("loading-overlay")).not.toBeVisible();
  await expect(page.getByText("Feedback?")).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});