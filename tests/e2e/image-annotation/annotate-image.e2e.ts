import { watchProblems } from '../annotate-support';
import { expect, test } from '../auth-fixture';
import { visualSnapshot } from '../visual-snapshot';
import { ImageAnnotationPage } from './image-annotation-page';

// Ported from legacy `image-annotation/annotate-image.spec.ts` (2.7), same steps and snapshot
// names. Legacy relied on the snapshots alone; Percy only runs on PRs to staging and main, so each
// test also checks what the canvas holds. The sketchpad paints on animation frames, the last one
// after the pointer is released, hence the polling.

const FROM = { x: 300, y: 300 };
const TO = { x: 400, y: 400 };

let annotation: ImageAnnotationPage;

test.beforeEach(async ({ page }) => {
	annotation = new ImageAnnotationPage(page);
});

test('Load', async ({ page }) => {
	const problems = watchProblems(page);

	await annotation.load();

	await expect(page.getByText('Feedback?')).toBeVisible();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	// It starts transparent and fades in once loaded.
	await expect(page.locator('img[src^="/images/annotation-app/illustrations/"]')).toHaveCSS(
		'opacity',
		'1'
	);
	expect(await annotation.inkAt(350, 350)).toBe(false);
	expect(problems).toEqual([]);

	await visualSnapshot(page, 'Image annotation page');
});

test('Draw a line', async ({ page }) => {
	await annotation.load();

	await annotation.drag(FROM, TO);

	// On the diagonal, and not on the edges a rectangle would draw.
	await expect.poll(() => annotation.inkAt(350, 350)).toBe(true);
	expect(await annotation.inkAt(350, 300)).toBe(false);

	await visualSnapshot(page, 'Image annotation - Draw a line');
});

test('Add typed text', async ({ page }) => {
	const text = 'Typed text test';

	await annotation.load();

	await page.getByTestId('text').click();

	await page.mouse.click(500, 500);

	// Input is expected to be auto-focused
	await page.keyboard.type(text);

	await expect(page.locator('textarea')).toHaveValue(text);

	await visualSnapshot(page, 'Image annotation - Type some text');
});

test('Draw a square', async ({ page }) => {
	await annotation.load();

	await page.getByTestId('shape').click();

	await annotation.drag(FROM, TO);

	// On all four edges, and not on the diagonal a pen stroke would draw.
	await expect.poll(() => annotation.inkAt(350, 300)).toBe(true);
	await expect.poll(() => annotation.inkAt(350, 400)).toBe(true);
	await expect.poll(() => annotation.inkAt(300, 350)).toBe(true);
	await expect.poll(() => annotation.inkAt(400, 350)).toBe(true);
	expect(await annotation.inkAt(350, 350)).toBe(false);

	await visualSnapshot(page, 'Image annotation - Draw a square');
});
