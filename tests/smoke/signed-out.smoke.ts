import { expect, test } from '@playwright/test';
import { watch } from './support';

// As served by Netlify, signed out. Reads only; the one POST is refused before it does anything.

test('the home page is the sign-in form, first-party only, with no CSP violations', async ({
	page,
	baseURL
}) => {
	const { thirdParty, problems } = watch(page, baseURL!);
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
	expect(thirdParty).toEqual([]);
	expect(problems).toEqual([]);
});

test('security headers reach the browser', async ({ request, baseURL }) => {
	const headers = (await request.get('/')).headers();

	expect(headers['content-security-policy']).toMatch(/script-src [^;]*'nonce-/);
	expect(headers['content-security-policy']).not.toMatch(/script-src [^;]*'unsafe-inline'/);
	expect(headers['x-content-type-options']).toBe('nosniff');
	expect(headers['x-frame-options']).toBe('DENY');
	expect(headers['referrer-policy']).toBe('same-origin');
	if (baseURL!.startsWith('https:')) expect(headers['strict-transport-security']).toBeTruthy();
});

test('the guard redirects, and removed addresses are 404s with our page', async ({
	request,
	page
}) => {
	const guarded = await request.get('/annotate', { maxRedirects: 0 });
	expect(guarded.status()).toBe(303);
	expect(guarded.headers()['location']).toBe('/?next=%2Fannotate');

	for (const path of ['/admin', '/sign-in', '/does-not-exist']) {
		const response = await page.goto(path);
		expect(response?.status(), path).toBe(404);
		await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
	}
});

test('a cross-site form post is refused', async ({ request }) => {
	const response = await request.post('/', {
		data: 'x=1',
		headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' }
	});
	expect(response.status()).toBe(403);
});

test('the image proxy serves a real image, cacheably and without a cookie', async ({ request }) => {
	const image = await request.get('/images/annotation-app/postscript-logo-raster.png');
	expect(image.status()).toBe(200);
	expect(image.headers()['content-type']).toBe('image/png');
	expect(image.headers()['cache-control']).toContain('public');
	expect(image.headers()['set-cookie']).toBeUndefined();
	expect((await image.body()).subarray(1, 4).toString()).toBe('PNG');

	const refused = await request.get('/images/other/x.jpg', { maxRedirects: 0 });
	expect(refused.status()).toBe(404);
});
