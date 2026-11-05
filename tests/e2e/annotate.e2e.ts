import { expect, test, type Page } from '@playwright/test';
import { PASSWORD, cleanUp, clearRateLimits, confirmedAccount, sql } from './support';

// /annotate in a real browser (2.4): first visit (specialty, then the catalogue), choosing an
// illustration, the choice surviving a reload, and a failed save. Images come from a stub (below),
// so E2E never contacts Cloudinary; the proxy's allow-list is checked at the end.

// A 1×1 transparent PNG.
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64'
);

test.beforeEach(async ({ page }) => {
	await clearRateLimits();
	await page.route('**/images/**', (route) =>
		route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
	);
});
test.afterAll(cleanUp);

function watchProblems(page: Page) {
	const problems: string[] = [];
	page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
	page.on('console', (message) => {
		if (message.type() === 'error' || /Content Security Policy|Refused to/i.test(message.text())) {
			problems.push(`${message.type()}: ${message.text()}`);
		}
	});
	return problems;
}

async function signIn(page: Page, email: string) {
	await page.goto('/sign-in?next=%2Fannotate');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/annotate$/);
}

async function storedIllustrationId(authId: string) {
	const [row] = await sql<{ id: string | null }[]>`
		select s.selected_illustration_id as id
		from public.user_app_states as s join public.users as u on u.id = s.user_id
		where u.auth_id = ${authId}`;
	return row?.id ?? null;
}

// The full-size illustration on the canvas (thumbnails are under /images/c_thumb,…).
const canvasIllustration = (page: Page) =>
	page.locator('img[src^="/images/annotation-app/illustrations/"]');
const catalogue = (page: Page) => page.getByRole('dialog', { name: 'Illustration catalogue' });

/** First visit: pick the first specialty; the catalogue opens. */
async function chooseFirstSpecialty(page: Page) {
	const welcome = page.getByRole('dialog', { name: 'Welcome to PostScript' });
	await expect(welcome).toBeVisible();
	await expect(welcome.getByRole('button', { name: 'Confirm' })).toBeDisabled();
	await welcome.locator('label').first().click();
	await welcome.getByRole('button', { name: 'Confirm' }).click();
	await expect(welcome).toBeHidden();
	await expect(catalogue(page)).toBeVisible();
}

test('first visit: choose a specialty, then an illustration, which a reload keeps', async ({
	page
}) => {
	const problems = watchProblems(page);
	const { email, authId } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);

	// Search narrows the grid (by name or alias) and says when nothing matches.
	const cards = catalogue(page).locator('button.card');
	const search = catalogue(page).getByRole('searchbox', { name: 'Search illustrations' });
	await expect(cards.first()).toBeVisible();
	const total = await cards.count();
	const second = (await cards.nth(1).textContent())!.trim();
	await search.fill(second);
	await expect(cards.filter({ hasText: second }).first()).toBeVisible();
	expect(await cards.count()).toBeLessThanOrEqual(total);
	await search.fill('zzz-no-such-illustration');
	await expect(catalogue(page).getByText('No results found...')).toBeVisible();
	await search.fill('');
	await expect(cards).toHaveCount(total);

	const card = cards.first();
	const name = (await card.textContent())!.trim();
	await card.click();
	await expect(catalogue(page)).toBeHidden();
	await expect(canvasIllustration(page)).toHaveCount(1);
	expect(await storedIllustrationId(authId)).not.toBeNull();

	await page.reload();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(canvasIllustration(page)).toHaveCount(1);

	// The catalogue reopens on the saved illustration, marked as chosen.
	await page.getByTestId('catalogue').click();
	await expect(catalogue(page).getByRole('button', { name, pressed: true })).toBeVisible();

	expect(problems).toEqual([]);
});

test('a failed save shows an error and keeps the current illustration', async ({ page }) => {
	const { email, authId } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);

	await page.route('**/annotate?/chooseIllustration', (route) => route.abort());
	await catalogue(page).locator('button.card').first().click();

	await expect(catalogue(page).getByRole('alert')).toContainText("We couldn't save your choice");
	await expect(catalogue(page)).toBeVisible();
	await expect(canvasIllustration(page)).toHaveCount(0);
	expect(await storedIllustrationId(authId)).toBeNull();
});

test('the user menu links to the account and signs out', async ({ page }) => {
	const { email } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);
	await page.getByTestId('close-catalogue').click();
	await expect(catalogue(page)).toBeHidden();

	const menu = page.getByRole('button', { name: 'Account menu' });
	await expect(menu).toHaveText(email[0].toUpperCase());
	await expect(menu).toHaveAttribute('aria-expanded', 'false');
	await menu.click();
	await expect(menu).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByRole('link', { name: 'Your account' })).toHaveAttribute(
		'href',
		'/account'
	);

	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page).toHaveURL(/\/sign-in$/);
	await page.goto('/annotate');
	await expect(page).toHaveURL(/\/sign-in\?next=%2Fannotate$/);
});

test('the image proxy refuses paths outside its allow-list', async ({ request }) => {
	for (const path of [
		'/images/annotation-app/illustrations/x.svg',
		'/images/c_scale,w_5000/annotation-app/illustrations/x.jpg',
		'/images/other/x.jpg',
		'/images/annotation-app/illustrations/a%2Fb.jpg'
	]) {
		const response = await request.get(path, { maxRedirects: 0 });
		expect(response.status(), path).toBe(404);
		expect(response.headers()['x-content-type-options']).toBe('nosniff');
	}
});
