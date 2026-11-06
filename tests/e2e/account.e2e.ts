import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { PASSWORD, cleanUp, clearRateLimits, confirmedAccount } from './support';

// The account page in a real browser (auth-spec §4.3): see it, download my data, delete the
// account. Change password and the session list are covered behind the hook in
// tests/integration/account.test.ts.

test.beforeEach(clearRateLimits);
test.afterAll(cleanUp);

async function signIn(page: Page, email: string) {
	await page.goto('/?next=%2Faccount');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);
}

test('shows the account, with this device in the session list', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your account');
	await expect(page.getByText(email, { exact: true })).toBeVisible();
	await expect(page.getByText('This device')).toBeVisible();
	await expect(page.getByText('Shared device')).toBeVisible();
});

test('downloads my data as a JSON file', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email);
	// Chromium saves the attachment (its body is then only in the download); Playwright's WebKit
	// shows it inline. Either way the response headers are checked, and the JSON read from
	// wherever the browser put it.
	const download = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().endsWith('/account/export')),
		page.getByRole('button', { name: 'Download my data' }).click()
	]);
	expect(response.status()).toBe(200);
	expect(response.headers()['content-disposition']).toMatch(
		/^attachment; filename="postscript-account-\d{4}-\d{2}-\d{2}\.json"$/
	);
	expect(response.headers()['cache-control']).toBe('no-store');
	const saved = await download;
	const data = saved
		? JSON.parse(await readFile((await saved.path())!, 'utf8'))
		: await response.json();
	expect(data.login.email).toBe(email);
	expect(data.workspaces).toHaveLength(1);

	// Still signed in afterwards.
	await page.goto('/account');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your account');
});

test('deletes the account', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email);
	const form = page.getByRole('region', { name: 'Delete your account' });

	await form.getByLabel('Current password').fill(PASSWORD);
	await form.getByLabel('Type your email address to confirm').fill('someone-else@example.com');
	await form.getByRole('button', { name: 'Delete my account' }).click();
	await expect(form.getByText('Type the email address of this account.')).toBeVisible();

	await form.getByLabel('Type your email address to confirm').fill(email);
	await form.getByRole('button', { name: 'Delete my account' }).click();
	await expect(page).toHaveURL(/\/\?deleted=1$/);
	await expect(page.getByRole('status')).toHaveText('Your account has been deleted.');
	expect((await page.context().cookies()).filter((c) => c.name.startsWith('sb-'))).toEqual([]);

	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toContainText("don't match an account");
});
