import { expect, type Page } from '@playwright/test';
import { PASSWORD } from './support';

// Shared by the /annotate journeys (2.4, 2.5): an image stub, so E2E never contacts Cloudinary,
// and the steps every journey starts with.

// A 1×1 transparent PNG.
export const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64'
);

/** Serves every /images/** request from the stub. */
export async function stubImages(page: Page) {
	await page.route('**/images/**', (route) =>
		route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
	);
}

/** Page errors, console errors and CSP reports. */
export function watchProblems(page: Page) {
	const problems: string[] = [];
	page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
	page.on('console', (message) => {
		if (message.type() === 'error' || /Content Security Policy|Refused to/i.test(message.text())) {
			problems.push(`${message.type()}: ${message.text()}`);
		}
	});
	return problems;
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
	await page.goto('/?next=%2Fannotate');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/annotate$/);
}

// The full-size illustration on the canvas (thumbnails are under /images/c_thumb,…).
export const canvasIllustration = (page: Page) =>
	page.locator('img[src^="/images/annotation-app/illustrations/"]');
export const catalogue = (page: Page) =>
	page.getByRole('dialog', { name: 'Illustration catalogue' });

/** First visit: pick the first specialty; the catalogue opens. */
export async function chooseFirstSpecialty(page: Page) {
	const welcome = page.getByRole('dialog', { name: 'Welcome to PostScript' });
	await expect(welcome).toBeVisible();
	await expect(welcome.getByRole('button', { name: 'Confirm' })).toBeDisabled();
	await welcome.locator('label').first().click();
	await welcome.getByRole('button', { name: 'Confirm' }).click();
	await expect(welcome).toBeHidden();
	await expect(catalogue(page)).toBeVisible();
}
