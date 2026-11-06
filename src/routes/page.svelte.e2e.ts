import { expect, test } from '@playwright/test';
import { cleanUp, clearRateLimits, confirmedAccount, PASSWORD } from '../../tests/e2e/support';

test.afterAll(cleanUp);

test('the home page is the sign-in form', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
	await expect(page).toHaveTitle('Sign in · PostScript Medical');
	await expect(page.locator('body')).toHaveClass(/ps-app/);
	await expect(page.getByText('on its way')).toHaveCount(0);
});

test('there is no separate sign-in page', async ({ request }) => {
	for (const path of ['/sign-in', '/sign-in?next=%2Fannotate']) {
		expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
	}
});

test('signing in from the home page, with no destination, opens the app', async ({ page }) => {
	await clearRateLimits();
	const { email } = await confirmedAccount();
	await page.goto('/');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/annotate$/);

	// Already signed in, the home page goes straight to the app.
	await page.goto('/');
	await expect(page).toHaveURL(/\/annotate$/);
});

test('signing in after being sent to the home page returns to where you were going', async ({
	page
}) => {
	await clearRateLimits();
	const { email } = await confirmedAccount();
	await page.goto('/account');
	await expect(page).toHaveURL(/\/\?next=%2Faccount$/);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);
});

test('loads only first-party resources, including the self-hosted font', async ({
	page,
	baseURL
}) => {
	const origin = new URL(baseURL ?? page.url()).origin;
	const requests: string[] = [];
	page.on('request', (request) => requests.push(request.url()));

	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);

	const thirdParty = requests.filter((url) => !url.startsWith(origin) && !url.startsWith('data:'));
	expect(thirdParty).toEqual([]);
	expect(requests.some((url) => url.includes('/fonts/montserrat-latin-wght-normal.woff2'))).toBe(
		true
	);
	expect(requests.some((url) => url.endsWith('/bg_logo.svg'))).toBe(true);
	expect(await page.evaluate(() => document.fonts.check('400 16px Montserrat'))).toBe(true);
});
