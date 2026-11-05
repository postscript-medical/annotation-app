import { readFile } from 'node:fs/promises';
import { expect, test, type Page, type Request } from '@playwright/test';
import {
	canvasIllustration,
	catalogue,
	chooseFirstSpecialty,
	signIn,
	stubImages,
	watchProblems
} from './annotate-support';
import { cleanUp, clearRateLimits, confirmedAccount } from './support';

// Device-only sharing (2.5, data-protection §2): the annotated JPEG goes to the share sheet, a
// download or the printer, and no request ever carries it.

test.beforeEach(async ({ page }) => {
	await clearRateLimits();
	await stubImages(page);
});
test.afterAll(cleanUp);

/** Every request from now on, with whether it carried a body. */
function watchRequests(page: Page) {
	const seen: { method: string; url: string; body: number; image: boolean }[] = [];
	page.on('request', (request: Request) => {
		const body = request.postDataBuffer();
		seen.push({
			method: request.method(),
			url: request.url(),
			body: body?.length ?? 0,
			image: body ? looksLikeImage(body) : false
		});
	});
	return seen;
}

function looksLikeImage(body: Buffer) {
	const text = body.toString('latin1');
	return (
		body.includes(Buffer.from([0xff, 0xd8, 0xff])) ||
		body.includes(Buffer.from('\x89PNG', 'latin1')) ||
		/data:image|base64,/i.test(text)
	);
}

/** Signs in a new account, picks an illustration and draws one stroke across the canvas. */
async function annotated(page: Page) {
	const { email } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);
	await catalogue(page).locator('button.card').first().click();
	await expect(catalogue(page)).toBeHidden();
	await expect(canvasIllustration(page)).toHaveCount(1);

	const box = (await page.locator('canvas').first().boundingBox())!;
	await page.mouse.move(box.x + 50, box.y + 50);
	await page.mouse.down();
	for (let step = 1; step <= 12; step++) {
		await page.mouse.move(box.x + 50 + step * 20, box.y + 50 + step * 10);
	}
	await page.mouse.up();
}

async function openShare(page: Page) {
	await page.getByRole('button', { name: 'Share annotation' }).click();
	const modal = page.getByRole('dialog', { name: 'Share the annotated image' });
	await expect(modal).toBeVisible();
	await expect(modal.getByRole('button', { name: 'Download image' })).toBeEnabled();
	return modal;
}

/** Decodes a JPEG in the page and counts its dark pixels (the black stroke). */
async function darkPixels(page: Page, jpeg: Buffer) {
	return page.evaluate(async (base64) => {
		const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
		const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const context = canvas.getContext('2d')!;
		context.drawImage(bitmap, 0, 0);
		const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
		let dark = 0;
		for (let i = 0; i < data.length; i += 4) if (data[i] + data[i + 1] + data[i + 2] < 150) dark++;
		return { dark, width: bitmap.width, height: bitmap.height };
	}, jpeg.toString('base64'));
}

test('downloads the annotated image as a JPEG, sending it nowhere', async ({ page }) => {
	const problems = watchProblems(page);
	await annotated(page);
	const requests = watchRequests(page);
	const modal = await openShare(page);

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		modal.getByRole('button', { name: 'Download image' }).click()
	]);
	expect(download.suggestedFilename()).toBe('postscript-annotation.jpg');
	const jpeg = await readFile((await download.path())!);
	expect([...jpeg.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
	await expect(modal.getByRole('status')).toHaveText('The image has been downloaded.');

	// The stroke is in the image, at the canvas's size.
	const decoded = await darkPixels(page, jpeg);
	expect(decoded.dark).toBeGreaterThan(50);
	const canvasWidth = await page
		.locator('canvas')
		.first()
		.evaluate((c) => (c as HTMLCanvasElement).width);
	expect(decoded.width).toBe(canvasWidth);

	// Nothing left the page but GETs (the watermark), none with a body.
	expect(requests.filter((r) => r.method !== 'GET' || r.body > 0)).toEqual([]);
	expect(problems).toEqual([]);
});

test('shares the JPEG through the system share sheet where the browser can', async ({ page }) => {
	// A recording stand-in for the Web Share API (desktop test browsers don't share files).
	await page.addInitScript(() => {
		const record = window as unknown as { __shared: unknown[] };
		record.__shared = [];
		Object.defineProperty(Navigator.prototype, 'canShare', {
			configurable: true,
			value: (data: { files?: File[] }) => Array.isArray(data?.files)
		});
		Object.defineProperty(Navigator.prototype, 'share', {
			configurable: true,
			value: async (data: { files: File[]; title?: string }) => {
				const [file] = data.files;
				const head = [...new Uint8Array(await file.slice(0, 3).arrayBuffer())];
				record.__shared.push({
					name: file.name,
					type: file.type,
					size: file.size,
					head,
					title: data.title
				});
			}
		});
	});
	await annotated(page);
	const requests = watchRequests(page);
	const modal = await openShare(page);

	await modal.getByRole('button', { name: 'Share image' }).click();

	await expect
		.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared))
		.toEqual([
			{
				name: 'postscript-annotation.jpg',
				type: 'image/jpeg',
				size: expect.any(Number),
				head: [0xff, 0xd8, 0xff],
				title: 'Annotated illustration'
			}
		]);
	await expect(modal.getByRole('status')).toHaveCount(0);
	expect(requests.filter((r) => r.method !== 'GET' || r.body > 0 || r.image)).toEqual([]);
});

test('without file sharing, there is no Share button, only download and print', async ({
	page
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(Navigator.prototype, 'canShare', {
			configurable: true,
			value: undefined
		});
		Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: undefined });
	});
	await annotated(page);
	const modal = await openShare(page);

	await expect(modal.getByRole('button', { name: 'Share image' })).toHaveCount(0);
	await expect(modal.getByRole('button', { name: 'Print image' })).toBeVisible();
});

test('prints the page without the tools, with the watermark', async ({ page }) => {
	await page.addInitScript(() => {
		const record = window as unknown as { __printed: number };
		record.__printed = 0;
		window.print = () => void record.__printed++;
	});
	await annotated(page);
	const modal = await openShare(page);

	await modal.getByRole('button', { name: 'Print image' }).click();

	await expect(modal).toBeHidden();
	await expect
		.poll(() => page.evaluate(() => (window as unknown as { __printed: number }).__printed))
		.toBe(1);

	await page.emulateMedia({ media: 'print' });
	await expect(page.getByTestId('catalogue')).toBeHidden();
	await expect(page.getByRole('button', { name: 'Share annotation' })).toBeHidden();
	await expect(page.locator('img.watermark')).toBeVisible();
	await expect(canvasIllustration(page)).toBeVisible();
});
