import { expect, test } from '@playwright/test';

test('renders the static shell', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('PostScript Medical');
	await expect(page).toHaveTitle('PostScript Medical');
	await expect(page.locator('body')).toHaveClass(/ps-app/);
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
