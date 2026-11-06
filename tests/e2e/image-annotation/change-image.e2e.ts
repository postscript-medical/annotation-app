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

	await page.locator('.undo-redo button').first().click();
	await expect.poll(() => annotation.inkAt(400, 300)).toBe(true);
});
