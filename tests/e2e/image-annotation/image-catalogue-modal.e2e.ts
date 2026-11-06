import { expect, test } from '../auth-fixture';
import { visualSnapshot } from '../visual-snapshot';
import { ImageAnnotationPage } from './image-annotation-page';

// Ported from legacy `image-annotation/image-catalogue-modal.spec.ts` (2.7).

test.beforeEach(async ({ page }) => {
	const annotation = new ImageAnnotationPage(page);

	await annotation.load();

	await annotation.openCatalogue();
});

test('Open catalogue', async ({ page }) => {
	// The fixture's saved illustration is marked as chosen.
	await expect(page.locator('button.card[aria-pressed="true"]')).toHaveCount(1);

	await visualSnapshot(page, 'Image catalogue modal');
});

test('Close catalogue', async ({ page }) => {
	const closeCatalogue = page.getByTestId('close-catalogue');

	await closeCatalogue.hover();

	await expect(page.getByTestId('tooltip')).toBeVisible();

	await closeCatalogue.click();

	await expect(page.getByRole('heading', { name: 'Illustration catalogue' })).toBeHidden();

	await expect(page.getByTestId('tooltip')).toBeHidden();
});
