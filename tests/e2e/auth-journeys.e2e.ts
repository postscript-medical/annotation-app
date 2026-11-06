import { expect, test, type Page } from '@playwright/test';
import {
	NEW_PASSWORD,
	PASSWORD,
	accountExists,
	ageSessions,
	cleanUp,
	clearRateLimits,
	confirmPathFromEmail,
	confirmedAccount,
	newEmail
} from './support';

// The auth journeys in a real browser against the production build and the local stack, with
// emails read from Mailpit (execution plan 1.11).

test.beforeEach(clearRateLimits);
test.afterAll(cleanUp);

async function signIn(page: Page, email: string, password: string, { shared = true } = {}) {
	await page.goto('/');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByLabel(/This is a shared device/).setChecked(shared);
	await page.getByRole('button', { name: 'Sign in' }).click();
}

async function authCookies(page: Page) {
	return (await page.context().cookies()).filter((c) => c.name.startsWith('sb-'));
}

test('sign up → confirm link → signed in, account created (personal device)', async ({ page }) => {
	const email = newEmail();
	const started = Date.now();
	await page.goto('/sign-up');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email');
	expect(await accountExists(email)).toBe(false);
	// Signing up sets no cookie at all (no PKCE code-verifier leftovers).
	expect(await page.context().cookies()).toEqual([]);

	await page.goto(await confirmPathFromEmail(email, started));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirm your account');
	await page.getByLabel(/This is a shared device/).uncheck();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL(/\/annotate$/);
	expect(await accountExists(email)).toBe(true);
	for (const cookie of await authCookies(page)) {
		expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 24 * 3600);
	}
});

test('sign in on a shared device → browser-session cookies', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email, PASSWORD, { shared: true });
	await expect(page).toHaveURL(/\/annotate$/);
	const cookies = await authCookies(page);
	expect(cookies.length).toBeGreaterThan(0);
	// -1: no Expires/Max-Age, so the cookie goes when the browser closes.
	for (const cookie of cookies) expect(cookie.expires).toBe(-1);
});

test('a wrong password and an unknown address get the same message', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email, 'not the right password at all');
	const wrongPassword = await page.getByRole('alert').textContent();
	await signIn(page, newEmail(), PASSWORD);
	const unknownAddress = await page.getByRole('alert').textContent();
	expect(wrongPassword).toBe(unknownAddress);
	expect(wrongPassword).toContain("don't match an account");
});

test('forgot → reset: old password fails, other sessions are signed out', async ({ browser }) => {
	const { email } = await confirmedAccount();

	// Another device, signed in.
	const otherDevice = await browser.newContext();
	const other = await otherDevice.newPage();
	await signIn(other, email, PASSWORD, { shared: false });
	await expect(other).toHaveURL(/\/annotate$/);

	const device = await browser.newContext();
	const page = await device.newPage();
	await page.goto('/forgot-password');
	await page.getByLabel('Email').fill(email);
	const started = Date.now();
	await page.getByRole('button', { name: 'Send me a link' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email');

	await page.goto(await confirmPathFromEmail(email, started));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Set a new password');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL(/\/reset-password$/);
	await page.getByLabel('New password').fill(NEW_PASSWORD);
	await page.getByRole('button', { name: 'Save new password' }).click();
	await expect(page).toHaveURL(/\/annotate$/);

	// The other device is signed out on its next request.
	await other.reload();
	await expect(other.getByRole('heading', { name: 'Sign in' })).toBeVisible();

	// The reset page can't be used again: it sends this signed-in user away (to /forgot-password,
	// which sends signed-in users on to the app).
	await page.goto('/reset-password');
	await expect(page).toHaveURL(/\/annotate$/);

	const fresh = await (await browser.newContext()).newPage();
	await signIn(fresh, email, PASSWORD);
	await expect(fresh.getByRole('alert')).toContainText("don't match an account");
	await signIn(fresh, email, NEW_PASSWORD);
	await expect(fresh).toHaveURL(/\/annotate$/);

	await otherDevice.close();
	await device.close();
});

test('a passwordless account (as created at cutover) sets its first password', async ({ page }) => {
	const { email } = await confirmedAccount(newEmail(), undefined);
	await page.goto('/forgot-password');
	await page.getByLabel('Email').fill(email);
	const started = Date.now();
	await page.getByRole('button', { name: 'Send me a link' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email');

	await page.goto(await confirmPathFromEmail(email, started));
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByLabel('New password').fill(NEW_PASSWORD);
	await page.getByRole('button', { name: 'Save new password' }).click();
	await expect(page).toHaveURL(/\/annotate$/);

	await page.context().clearCookies();
	await signIn(page, email, NEW_PASSWORD);
	await expect(page).toHaveURL(/\/annotate$/);
});

test('an expired session is signed out with a notice', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email, PASSWORD, { shared: true });
	await expect(page).toHaveURL(/\/annotate$/);

	await ageSessions(email);
	await page.reload();
	await expect(page).toHaveURL(/\/\?expired=1$/);
	await expect(page.getByRole('status')).toHaveText(
		'Your session has ended. Please sign in again.'
	);
	expect(await authCookies(page)).toEqual([]);
});
