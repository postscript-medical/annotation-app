import { expect, test, type Page } from '@playwright/test';
import { clearRateLimits } from './support';

// What someone types before the page has hydrated (a slow connection) must survive hydration:
// open issue 2 in the execution plan. The app's scripts are held back until the typing is done.

/** Opens the page with the app's scripts held back; the function returned releases them. */
async function openBeforeHydration(page: Page, path: string) {
	let release!: () => void;
	const held = new Promise<void>((resolve) => (release = resolve));
	await page.route('**/_app/immutable/entry/**', async (route) => {
		await held;
		await route.continue();
	});
	await page.goto(path, { waitUntil: 'commit' });
	return release;
}

/** The Show button only works once hydrated, so this returns only after hydration. */
async function hydrated(page: Page) {
	await expect(async () => {
		await page.getByRole('button', { name: /^(Show|Hide)$/ }).click();
		await expect(page.getByRole('button', { name: 'Hide' })).toBeVisible({ timeout: 200 });
	}).toPass();
}

test('sign-in keeps what was typed, and then submits it', async ({ page }) => {
	await clearRateLimits();
	const release = await openBeforeHydration(page, '/sign-in');
	const shared = page.getByLabel(/This is a shared device/);

	await page.getByLabel('Email').fill('early@example.com');
	await page.getByLabel('Password', { exact: true }).fill('not a real password at all');
	await shared.uncheck();
	release();
	await hydrated(page);

	await expect(page.getByLabel('Email')).toHaveValue('early@example.com');
	await expect(page.getByLabel('Password', { exact: true })).toHaveValue(
		'not a real password at all'
	);
	await expect(shared).not.toBeChecked();

	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		"That email address and password don't match an account."
	);
	await expect(page.getByLabel('Email')).toHaveValue('early@example.com');
});

test('sign-up keeps what was typed', async ({ page }) => {
	const release = await openBeforeHydration(page, '/sign-up');

	await page.getByLabel('Email').fill('early@example.com');
	release();
	await hydrated(page);

	await expect(page.getByLabel('Email')).toHaveValue('early@example.com');
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('a failed sign-in keeps the email', async ({ page }) => {
		await clearRateLimits();
		await page.goto('/sign-in');
		await page.getByLabel('Email').fill('nojs@example.com');
		await page.getByLabel('Password', { exact: true }).fill('not a real password at all');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page.getByRole('alert')).toHaveText(
			"That email address and password don't match an account."
		);
		await expect(page.getByLabel('Email')).toHaveValue('nojs@example.com');
	});
});
