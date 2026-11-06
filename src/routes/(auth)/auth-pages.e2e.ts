import { expect, test, type Page } from '@playwright/test';

// The auth pages on the production build: they render, have no CSP violations, and a real
// browser can sign in, stay signed in and sign out. Full journeys via Mailpit: 1.11.

function watchCsp(page: Page) {
	const violations: string[] = [];
	page.on('console', (message) => {
		if (/Content Security Policy|Refused to/i.test(message.text())) violations.push(message.text());
	});
	return violations;
}

for (const [path, heading] of [
	['/', 'Sign in'],
	['/sign-up', 'Create an account'],
	['/forgot-password', 'Forgot your password?'],
	['/resend-confirmation', 'Resend the confirmation email']
] as const) {
	test(`${path} renders without CSP violations`, async ({ page }) => {
		const violations = watchCsp(page);
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
		await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'username');
		expect(violations).toEqual([]);
	});
}

test('the password field can be shown and hidden', async ({ page }) => {
	await page.goto('/sign-up');
	const password = page.getByLabel('Password', { exact: true });
	await expect(password).toHaveAttribute('type', 'password');
	await expect(password).toHaveAttribute('autocomplete', 'new-password');
	await page.getByRole('button', { name: 'Show' }).click();
	await expect(password).toHaveAttribute('type', 'text');
	await page.getByRole('button', { name: 'Hide' }).click();
	await expect(password).toHaveAttribute('type', 'password');
});

test('a link without a valid token says so', async ({ page }) => {
	await page.goto('/auth/confirm?token_hash=x&type=signup');
	await expect(page.getByRole('alert')).toContainText('expired or has already been used');
});

test('signs in, stays signed in, signs out', async ({ page, context, baseURL }) => {
	const violations = watchCsp(page);
	await page.goto('/annotate');
	await expect(page).toHaveURL(/\/\?next=%2Fannotate$/);

	await page.getByLabel('Email').fill('test-user-1@example.com');
	await page.getByLabel('Password', { exact: true }).fill('local-test-password-one');
	await page.getByLabel(/This is a shared device/).uncheck();
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/annotate$/);
	await expect(page).toHaveTitle('Annotate · PostScript Medical');
	await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();

	const cookies = await context.cookies();
	const auth = cookies.filter((c) => c.name.startsWith('sb-'));
	expect(auth.length).toBeGreaterThan(0);
	for (const cookie of auth) {
		expect(cookie.httpOnly).toBe(true);
		expect(cookie.sameSite).toBe('Lax');
		// Personal device: kept for about 30 days.
		expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 24 * 3600);
	}

	await page.reload();
	await expect(page).toHaveTitle('Annotate · PostScript Medical');
	await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();

	const logout = await page.request.post('/logout', {
		// As a plain browser form sends it; with Accept: */* SvelteKit answers as for use:enhance.
		headers: { origin: new URL(baseURL!).origin, accept: 'text/html' },
		form: {},
		maxRedirects: 0
	});
	expect(logout.status()).toBe(303);
	await page.goto('/annotate');
	await expect(page).toHaveURL(/\/\?next=%2Fannotate$/);
	expect(violations).toEqual([]);
});

test('a wrong password gets the generic error', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel('Email').fill(`nobody-${Date.now()}@example.com`);
	await page.getByLabel('Password', { exact: true }).fill('not a real password at all');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		"That email address and password don't match an account."
	);
	await expect(page.getByLabel('Email')).toHaveValue(/nobody-/);
});

test('sign-up links to the terms and privacy notice on the marketing site', async ({ page }) => {
	await page.goto('/sign-up');
	await expect(page.getByRole('link', { name: 'Terms of use' })).toHaveAttribute(
		'href',
		'https://www.postscriptmedical.com/terms-of-use'
	);
	await expect(page.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute(
		'href',
		'https://www.postscriptmedical.com/privacy-policy'
	);
});

test('the header logo links to the app', async ({ page }) => {
	await page.goto('/');
	const home = page.getByRole('link', { name: 'PostScript Medical home' });
	await expect(home).toHaveAttribute('href', '/annotate');
	await expect(home.locator('svg title')).toHaveText('PostScript Medical');
});
