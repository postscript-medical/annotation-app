import { test, expect } from '@playwright/test';
import {
	canvasIllustration,
	catalogue,
	chooseFirstSpecialty,
	signIn,
	stubImages
} from '../annotate-support';
import { cleanUp, clearRateLimits, confirmedAccount } from '../support';
import { ImageAnnotationPage } from './image-annotation-page';

// Pins changing the illustration before and after the runes conversion (2.9). It saves a selection,
// so it has an account of its own rather than the shared fixture user.

test.afterAll(cleanUp);

test('choosing another illustration clears the drawing; undo brings the drawing back', async ({
	page
}) => {
	await clearRateLimits();
	await stubImages(page);
	const annotation = new ImageAnnotationPage(page);
	const { email } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);
	const cards = catalogue(page).locator('button.card');
	await cards.first().click();
	await expect(catalogue(page)).toBeHidden();
	const first = await canvasIllustration(page).getAttribute('src');

	await annotation.drag({ x: 300, y: 300 }, { x: 500, y: 300 });
	await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);

	await annotation.openCatalogue();
	await cards.nth(1).click();
	await expect(catalogue(page)).toBeHidden();

	await expect.poll(() => annotation.inkCount()).toBe(0);
	await expect(canvasIllustration(page)).toHaveCount(1);
	expect(await canvasIllustration(page).getAttribute('src')).not.toBe(first);

	const second = await canvasIllustration(page).getAttribute('src');

	// Undo goes back to the earlier illustration with its drawing, redo forward again.
	const undo = page.locator('.undo-redo button').first();
	const redo = page.locator('.undo-redo button').last();
	await undo.click();
	await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
	await expect(canvasIllustration(page)).toHaveAttribute('src', first!);

	// Drawing on it stays with it: the catalogue marks the illustration on screen.
	await annotation.openCatalogue();
	await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
	await page.getByTestId('close-catalogue').click();
	await expect(catalogue(page)).toBeHidden();

	await redo.click();
	await expect.poll(() => annotation.inkCount()).toBe(0);
	await expect(canvasIllustration(page)).toHaveAttribute('src', second!);

	// A resize rebuilds the history; it must not change which illustration is showing.
	await page.setViewportSize({ width: 1000, height: 600 });
	await page.waitForTimeout(100);
	await expect(canvasIllustration(page)).toHaveAttribute('src', second!);
	await undo.click();
	await expect(canvasIllustration(page)).toHaveAttribute('src', first!);

	// Undo only changes the screen: the saved choice is still the last one chosen.
	await page.reload();
	await expect(canvasIllustration(page)).toHaveAttribute('src', second!);
});

test('undoing the first choice goes back to no illustration, and sharing still works', async ({
	page
}) => {
	await clearRateLimits();
	await stubImages(page);
	const annotation = new ImageAnnotationPage(page);
	const { email } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);
	await catalogue(page).locator('button.card').first().click();
	await expect(catalogue(page)).toBeHidden();
	await expect(canvasIllustration(page)).toHaveCount(1);

	await page.locator('.undo-redo button').first().click();
	await expect(canvasIllustration(page)).toHaveCount(0);

	await annotation.drag({ x: 300, y: 300 }, { x: 500, y: 300 });
	await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
	await page.getByRole('button', { name: 'Share annotation' }).click();
	const share = page.getByRole('dialog', { name: 'Share the annotated image' });
	await expect(share.getByRole('button', { name: 'Download image' })).toBeEnabled();
});
