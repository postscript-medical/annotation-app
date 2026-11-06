import { expect, test } from '../auth-fixture';
import { ImageAnnotationPage } from './image-annotation-page';

// Pins how the sketchpad's tools behave, before and after the runes conversion (2.9). Written
// against the legacy-mode components and run on them first.

const LEFT = { x: 300, y: 300 };
const RIGHT = { x: 500, y: 300 };

let annotation: ImageAnnotationPage;

test.beforeEach(async ({ page }) => {
	annotation = new ImageAnnotationPage(page);
	await annotation.load();
});

const drawer = (page: import('@playwright/test').Page) => page.locator('.secondary-tools');

test.describe('tool drawers', () => {
	test('pressing the selected tool opens its drawer, and again closes it', async ({ page }) => {
		const pen = page.getByTestId('pen');
		await expect(drawer(page)).toHaveCount(0);

		await pen.click();
		await expect(drawer(page)).toBeVisible();

		await pen.click();
		await expect(drawer(page)).toHaveCount(0);

		await pen.click();
		await expect(drawer(page)).toBeVisible();
	});

	test('pressing another tool selects it and opens its drawer', async ({ page }) => {
		await page.getByTestId('eraser').click();
		await expect(drawer(page)).toBeVisible();
		await expect(drawer(page).locator('label')).toHaveCount(4);

		await page.getByTestId('shape').click();
		await expect(drawer(page).locator('label')).toHaveCount(3);

		// No sizes or shapes to choose: no drawer.
		await page.getByTestId('text').click();
		await expect(drawer(page)).toHaveCount(0);
	});

	test('pressing the canvas closes the drawer', async ({ page }) => {
		await page.getByTestId('pen').click();
		await expect(drawer(page)).toBeVisible();

		await page.mouse.click(LEFT.x, LEFT.y);
		await expect(drawer(page)).toHaveCount(0);
	});

	test('on a phone the drawer opens above its tool', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await annotation.load();

		const pen = page.getByTestId('pen');
		await pen.click();
		await expect(drawer(page)).toBeVisible();
		await expect(async () => {
			const open = (await drawer(page).boundingBox())!;
			const tool = (await pen.boundingBox())!;
			expect(open.y + open.height).toBeLessThanOrEqual(tool.y + 1);
		}).toPass();
	});

	test('the selected size is marked', async ({ page }) => {
		await page.getByTestId('pen').click();
		const sizes = drawer(page).locator('label');
		await expect(sizes.nth(0)).toHaveClass(/on-dark/);

		await sizes.nth(2).click();
		await expect(sizes.nth(2)).toHaveClass(/on-dark/);
		await expect(sizes.nth(0)).not.toHaveClass(/on-dark/);
	});
});

test.describe('pen', () => {
	test('a size changes how thick the line is', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
		expect(await annotation.inkAt(400, 303)).toBe(false);

		await page.getByTestId('pen').click();
		await drawer(page).locator('label').nth(2).click();
		await annotation.drag({ x: 300, y: 500 }, { x: 500, y: 500 });
		await expect.poll(() => annotation.inkAt(400, 500)).toBe(true);
		await expect.poll(() => annotation.inkAt(400, 502)).toBe(true);
	});

	test('a colour changes the colour of what comes next', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
		const black = await annotation.pixelAt(400, 300);
		expect(black[0]).toBeLessThan(60);

		await page.locator('#palette-red').click();
		await annotation.drag({ x: 300, y: 400 }, { x: 500, y: 400 });
		await expect.poll(() => annotation.inkAt(400, 400)).toBe(true);
		const red = await annotation.pixelAt(400, 400);
		expect(red[0]).toBeGreaterThan(200);
		expect(red[1]).toBeLessThan(60);

		// The earlier line keeps its colour.
		expect((await annotation.pixelAt(400, 300))[0]).toBeLessThan(60);
	});

	test('the cursor follows the stroke only while drawing', async ({ page }) => {
		const canvas = page.locator('canvas');
		await page.mouse.move(LEFT.x, LEFT.y);
		await page.mouse.down();
		await page.mouse.move(RIGHT.x, RIGHT.y);
		await expect(canvas).toHaveAttribute('style', /cursor: none/);
		await expect(page.locator('.paper > div[style*="translate3d"]')).toHaveCount(1);

		await page.mouse.up();
		await expect(canvas).not.toHaveAttribute('style', /cursor: none/);
		await expect(page.locator('.paper > div[style*="translate3d"]')).toHaveCount(0);
	});
});

test.describe('eraser', () => {
	test('rubs out only where it passes', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);

		await page.getByTestId('eraser').click();
		await annotation.drag({ x: 400, y: 250 }, { x: 400, y: 350 });

		await expect.poll(() => annotation.inkAt(400, 300)).toBe(false);
		await expect.poll(() => annotation.inkAt(320, 300)).toBe(true);
	});

	test('erase-all clears the canvas, and undo brings it back', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);

		await page.getByTestId('eraser').click();
		await page.locator('label#erase-all').click();
		await expect.poll(() => annotation.inkCount()).toBe(0);

		await page.locator('.undo-redo button').first().click();
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
	});
});

test.describe('shapes', () => {
	test('ellipse', async ({ page }) => {
		await page.getByTestId('shape').click();
		await page.locator('label#ellipse').click();
		await annotation.drag({ x: 300, y: 300 }, { x: 400, y: 400 });

		await expect.poll(() => annotation.inkAt(350, 300)).toBe(true);
		await expect.poll(() => annotation.inkAt(400, 350)).toBe(true);
		expect(await annotation.inkAt(350, 350)).toBe(false);
		expect(await annotation.inkAt(302, 302)).toBe(false);
	});

	test('arrow', async ({ page }) => {
		await page.getByTestId('shape').click();
		await page.locator('label#arrow').click();
		await annotation.drag({ x: 300, y: 300 }, { x: 400, y: 300 });

		await expect.poll(() => annotation.inkAt(350, 300)).toBe(true);
		// Both sides of the head, and nothing beside the shaft.
		await expect.poll(() => annotation.inkAt(390, 310)).toBe(true);
		await expect.poll(() => annotation.inkAt(390, 290)).toBe(true);
		expect(await annotation.inkAt(320, 310)).toBe(false);
	});

	test('takes the pen colour', async ({ page }) => {
		await page.locator('#palette-green').click();
		await page.getByTestId('shape').click();
		await annotation.drag({ x: 300, y: 300 }, { x: 400, y: 400 });

		await expect.poll(() => annotation.inkAt(350, 300)).toBe(true);
		const [red, green] = await annotation.pixelAt(350, 300);
		expect(green).toBeGreaterThan(red);
	});
});

test.describe('undo and redo', () => {
	const undo = (page: import('@playwright/test').Page) => page.locator('.undo-redo button').first();
	const redo = (page: import('@playwright/test').Page) => page.locator('.undo-redo button').last();

	test('the buttons step through the history and disable at its ends', async ({ page }) => {
		await expect(undo(page)).toBeDisabled();
		await expect(redo(page)).toBeDisabled();

		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
		await expect(undo(page)).toBeEnabled();
		await expect(redo(page)).toBeDisabled();

		await undo(page).click();
		await expect.poll(() => annotation.inkCount()).toBe(0);
		await expect(undo(page)).toBeDisabled();
		await expect(redo(page)).toBeEnabled();

		await redo(page).click();
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
	});

	test('Ctrl+Z undoes', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);

		await page.keyboard.press('Control+z');
		await expect.poll(() => annotation.inkCount()).toBe(0);
	});

	for (const combo of ['Control+Shift+z', 'Control+Shift+Z', 'Meta+Shift+z', 'Meta+Shift+Z']) {
		test(`${combo} redoes one step, however the key is reported`, async ({ page }) => {
			await annotation.drag(LEFT, RIGHT);
			await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
			await annotation.drag({ x: 300, y: 400 }, { x: 500, y: 400 });
			await expect.poll(() => annotation.inkAt(400, 400)).toBe(true);

			await page.keyboard.press('Control+z');
			await expect.poll(() => annotation.inkAt(400, 400)).toBe(false);
			await page.keyboard.press('Control+z');
			await expect.poll(() => annotation.inkCount()).toBe(0);

			await page.keyboard.press(combo);
			await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
			expect(await annotation.inkAt(400, 400)).toBe(false);

			await page.keyboard.press(combo);
			await expect.poll(() => annotation.inkAt(400, 400)).toBe(true);
		});
	}

	test('a new stroke after an undo drops what could have been redone', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
		await undo(page).click();
		await expect.poll(() => annotation.inkCount()).toBe(0);

		await annotation.drag({ x: 300, y: 400 }, { x: 500, y: 400 });
		await expect.poll(() => annotation.inkAt(400, 400)).toBe(true);
		await expect(redo(page)).toBeDisabled();
		expect(await annotation.inkAt(400, 300)).toBe(false);
	});
});

test.describe('typed text', () => {
	const entry = (page: import('@playwright/test').Page) => page.locator('.typed-text-entry');

	test('takes the pen colour and a place of its own', async ({ page }) => {
		await page.locator('#palette-red').click();
		await page.getByTestId('text').click();
		await page.mouse.click(500, 400);
		await page.keyboard.type('Red note');

		await expect(page.locator('textarea')).toHaveValue('Red note');
		await expect(page.locator('textarea')).toHaveCSS('color', 'rgb(255, 0, 0)');
		const box = (await entry(page).boundingBox())!;
		expect(Math.abs(box.x - 500)).toBeLessThan(2);
		expect(Math.abs(box.y - 400)).toBeLessThan(2);
	});

	test('each entry keeps its own text', async ({ page }) => {
		await page.getByTestId('text').click();
		await page.mouse.click(400, 300);
		await page.mouse.click(400, 500);
		await expect(page.locator('textarea')).toHaveCount(2);
		await page.locator('textarea').nth(0).fill('First');
		await page.locator('textarea').nth(1).fill('Second');

		await expect(page.locator('textarea').nth(0)).toHaveValue('First');
		await expect(page.locator('textarea').nth(1)).toHaveValue('Second');
	});

	test('typing goes into the note just added, not an earlier one', async ({ page }) => {
		await page.getByTestId('text').click();
		await page.mouse.click(400, 300);
		await page.keyboard.type('First');
		await page.mouse.click(400, 500);

		// WebKit's handling of the `autofocus` attribute used to move focus back a moment later.
		await expect(page.locator('textarea').nth(1)).toBeFocused();
		await page.waitForTimeout(400);
		await expect(page.locator('textarea').nth(1)).toBeFocused();
		await page.keyboard.type('Second');

		await expect(page.locator('textarea').nth(0)).toHaveValue('First');
		await expect(page.locator('textarea').nth(1)).toHaveValue('Second');
	});

	test('the close button removes it, and undo brings it back', async ({ page }) => {
		await page.getByTestId('text').click();
		await page.mouse.click(500, 400);
		await page.keyboard.type('Gone soon');

		await entry(page).hover();
		await entry(page).locator('button').last().click();
		await expect(page.locator('textarea')).toHaveCount(0);

		await page.locator('.undo-redo button').first().click();
		await expect(page.locator('textarea')).toHaveValue('Gone soon');
	});

	test('the handle drags it, within the paper', async ({ page }) => {
		await page.getByTestId('text').click();
		await page.mouse.click(500, 400);
		await page.keyboard.type('Moving');

		await entry(page).hover();
		const handle = (await entry(page).locator('.drag-handle').boundingBox())!;
		const before = (await entry(page).boundingBox())!;
		await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
		await page.mouse.down();
		await page.mouse.move(handle.x + handle.width / 2 + 100, handle.y + handle.height / 2 + 50, {
			steps: 5
		});
		await page.mouse.up();

		await expect(async () => {
			const after = (await entry(page).boundingBox())!;
			expect(after.x).toBeGreaterThan(before.x + 20);
			expect(after.y).toBeGreaterThan(before.y + 20);
		}).toPass();
		await expect(page.locator('textarea')).toHaveValue('Moving');

		// Past the paper's edge, it stops at the edge.
		const paper = (await page.locator('.paper').boundingBox())!;
		await entry(page).hover();
		const again = (await entry(page).locator('.drag-handle').boundingBox())!;
		await page.mouse.move(again.x + again.width / 2, again.y + again.height / 2);
		await page.mouse.down();
		await page.mouse.move(paper.x - 400, paper.y - 400, { steps: 5 });
		await page.mouse.up();
		await expect(async () => {
			const after = (await entry(page).boundingBox())!;
			expect(after.x).toBeGreaterThanOrEqual(paper.x - 1);
			expect(after.y).toBeGreaterThanOrEqual(paper.y - 1);
		}).toPass();
	});
});

test.describe('the rest of the screen', () => {
	test('tools, colours and undo show their tooltips', async ({ page }) => {
		const tooltip = page.getByTestId('tooltip');

		await page.getByTestId('pen').hover();
		await expect(tooltip).toHaveText('Annotate');
		await page.getByTestId('eraser').hover();
		await expect(tooltip).toHaveText('Erase');
		await page.locator('.colors-palette').hover();
		await expect(tooltip).toHaveText('Colors');
		await page.locator('.undo-redo button').last().hover({ force: true });
		await expect(tooltip).toHaveText('Redo action');

		await page.mouse.move(600, 600);
		await expect(tooltip).toHaveCount(0);
	});

	test('pressing the canvas closes the user menu', async ({ page }) => {
		const menu = page.getByRole('button', { name: 'Account menu' });
		await menu.click();
		await expect(menu).toHaveAttribute('aria-expanded', 'true');

		await page.mouse.click(LEFT.x, LEFT.y);
		await expect(menu).toHaveAttribute('aria-expanded', 'false');
	});

	test('a drawing survives a window resize', async ({ page }) => {
		await annotation.drag(LEFT, RIGHT);
		await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);

		await page.setViewportSize({ width: 1000, height: 600 });
		await expect.poll(() => annotation.inkCount()).toBeGreaterThan(0);
		await expect(async () => {
			const box = (await page.locator('canvas').boundingBox())!;
			const width = await page
				.locator('canvas')
				.evaluate((c: HTMLCanvasElement) => c.width / devicePixelRatio);
			expect(Math.abs(width - box.width)).toBeLessThanOrEqual(1);
		}).toPass();

		// Undo still works on the rescaled history.
		await page.locator('.undo-redo button').first().click();
		await expect.poll(() => annotation.inkCount()).toBe(0);
	});
});

// A non-zero transition-duration in app.css's reduced-motion rule made GSAP's `.from()` read
// mid-transition values as its end values, which left these collapsed or invisible.
test.describe('with reduced motion', () => {
	test.use({ contextOptions: { reducedMotion: 'reduce' } });

	// Check once the intro has ended: the bug only showed at its end, so an assertion that retries
	// from the start can pass on the way.
	const SETTLED = 500;

	test('a tool drawer shows its options', async ({ page }) => {
		await page.getByTestId('pen').click();
		await page.waitForTimeout(SETTLED);

		const options = drawer(page).locator('label');
		await expect(options).toHaveCount(3);
		const opacities = await options.evaluateAll((labels) =>
			labels.map((label) => getComputedStyle(label).opacity)
		);
		expect(opacities).toEqual(['1', '1', '1']);
	});

	test('the user menu opens, and signing out can be reached', async ({ page }) => {
		await page.getByRole('button', { name: 'Account menu' }).click();
		await page.waitForTimeout(SETTLED);

		const menu = await page.locator('#user-settings-menu').boundingBox();
		expect(menu?.height).toBeGreaterThan(0);
		await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
	});
});
