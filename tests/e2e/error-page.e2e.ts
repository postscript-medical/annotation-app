import { expect, test } from '@playwright/test';
import { watchProblems } from './annotate-support';
import { test as signedInTest } from './auth-fixture';

// The error page (src/routes/+error.svelte; legacy not-found-page.spec.ts).

test('an unknown address shows the page, with a 404 and a way back', async ({ page }) => {
	const problems = watchProblems(page);
	// The browser logs the 404 of the document itself; that one is expected.
	const response = await page.goto('/does-not-exist');
	expect(response?.status()).toBe(404);

	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
	await expect(page).toHaveTitle('Page not found · PostScript Medical');
	await expect(page.getByText("We couldn't find that page.")).toBeVisible();
	await expect(page.getByRole('link', { name: 'PostScript Medical home' })).toBeVisible();
	await expect(page.getByText('Reference:')).toHaveCount(0);
	expect(problems.filter((problem) => !/404/.test(problem))).toEqual([]);

	// Signed out, the way back ends at sign-in.
	await page.getByRole('link', { name: 'PostScript', exact: true }).click();
	await expect(page).toHaveURL(/\/\?next=%2Fannotate$/);
});

test('the removed admin area gets the same page', async ({ page }) => {
	const response = await page.goto('/admin');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

signedInTest('any other error says so and gives a reference, not "not found"', async ({ page }) => {
	await page.goto('/account');
	await page.waitForLoadState('networkidle');
	// As the server answers a client-side navigation whose load failed.
	await page.route('**/annotate/__data.json*', (route) =>
		route.fulfill({
			status: 500,
			json: { message: 'Something went wrong on our side.', requestId: 'ref-123' }
		})
	);

	await page.getByRole('link', { name: 'PostScript Medical home' }).click();

	await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
	await expect(page.getByText('Something went wrong on our side.')).toBeVisible();
	await expect(page.getByText('Reference: ref-123')).toBeVisible();
	await expect(page.getByText('Page not found')).toHaveCount(0);
});
