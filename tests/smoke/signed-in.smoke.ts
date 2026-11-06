import { expect, test } from '@playwright/test';
import { ImageAnnotationPage } from '../e2e/image-annotation/image-annotation-page';
import { watch } from './support';

// The account's working day on the deployed site: sign in, a real illustration through the proxy,
// draw, prepare the image, sign out. It sends no email: staging shares the Lettermint quota, so
// email flows stay a manual check.

test('sign in, draw on a real illustration, sign out', async ({
	page,
	context,
	baseURL
}, testInfo) => {
	test.setTimeout(60_000);
	const { thirdParty, problems } = watch(page, baseURL!);

	await page.goto('/?next=%2Fannotate');
	await page.getByLabel('Email').fill(process.env.SMOKE_EMAIL!);
	await page.getByLabel('Password', { exact: true }).fill(process.env.SMOKE_PASSWORD!);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/annotate$/);

	const cookies = (await context.cookies()).filter((c) => c.name.startsWith('sb-'));
	expect(cookies.length).toBeGreaterThan(0);
	for (const cookie of cookies) {
		expect(cookie.httpOnly).toBe(true);
		expect(cookie.sameSite).toBe('Lax');
		if (baseURL!.startsWith('https:')) expect(cookie.secure).toBe(true);
	}

	// A new account chooses first; this only writes its own selection.
	const welcome = page.getByRole('dialog', { name: 'Welcome to PostScript' });
	const illustration = page.locator('img[src^="/images/annotation-app/illustrations/"]');
	await expect(welcome.or(illustration)).toBeVisible({ timeout: 15_000 });
	if (await welcome.isVisible()) {
		await welcome.locator('label').first().click();
		await welcome.getByRole('button', { name: 'Confirm' }).click();
		const catalogue = page.getByRole('dialog', { name: 'Illustration catalogue' });
		await catalogue.locator('button.card').first().click();
		await expect(catalogue).toBeHidden();
	}

	await expect(illustration).toHaveCSS('opacity', '1', { timeout: 15_000 });
	expect(
		await illustration.evaluate((image: HTMLImageElement) => image.naturalWidth)
	).toBeGreaterThan(1);

	// In the middle of the paper, wherever the tools sit on this device.
	const box = (await page.locator('canvas').boundingBox())!;
	const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
	const annotation = new ImageAnnotationPage(page);
	await annotation.drag({ x: middle.x - 60, y: middle.y }, { x: middle.x + 60, y: middle.y });
	await expect.poll(() => annotation.inkAt(middle.x, middle.y)).toBe(true);

	await page.getByRole('button', { name: 'Share annotation' }).click();
	const share = page.getByRole('dialog', { name: 'Share the annotated image' });
	const download = share.getByRole('button', { name: 'Download image' });
	await expect(download).toBeEnabled({ timeout: 15_000 });
	// Only Chromium reliably reports a download under automation.
	if (testInfo.project.name === 'chromium') {
		const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
		expect(file.suggestedFilename()).toBe('postscript-annotation.jpg');
	}
	await share
		.getByRole('button', { name: /close|cancel/i })
		.first()
		.click();
	await expect(share).toBeHidden();

	await page.waitForLoadState('networkidle');
	expect(thirdParty).toEqual([]);
	expect(problems).toEqual([]);

	await page.getByRole('button', { name: 'Account menu' }).click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
	await page.goto('/annotate');
	await expect(page).toHaveURL(/\/\?next=%2Fannotate$/);
});
