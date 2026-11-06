import { expect, test } from '@playwright/test';
import { visualSnapshot } from './visual-snapshot';

// The legacy page snapshots that still have a page (2.7, from legacy `login-page.spec.ts` and
// `not-found-page.spec.ts`). What these pages do is tested in auth-pages, auth-journeys and
// error-page.

test('Sign-in page', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

	await visualSnapshot(page, 'Login page');
});

test('Forgot password page', async ({ page }) => {
	await page.goto('/forgot-password');
	await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();

	await visualSnapshot(page, 'Forgot your password');
});

test('Page not found', async ({ page }) => {
	await page.goto('/does-not-exist');
	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

	await visualSnapshot(page, 'Page not found');
});
