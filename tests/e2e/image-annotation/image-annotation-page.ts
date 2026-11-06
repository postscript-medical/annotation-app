import { expect, type Locator, type Page } from '@playwright/test';

/** Ported from legacy `shared/image-annotation-page.ts`. */
export class ImageAnnotationPage {
	readonly page: Page;
	readonly catalogueButton: Locator;
	readonly catalogue: Locator;

	constructor(page: Page) {
		this.page = page;
		this.catalogueButton = page.getByTestId('catalogue');
		this.catalogue = page.getByRole('dialog', { name: 'Illustration catalogue' });
	}

	async load() {
		const illustration = this.page.waitForResponse('**/images/annotation-app/illustrations/*');

		await this.page.goto('/annotate');

		await illustration;

		await expect(this.page.getByTestId('loading-overlay')).toBeHidden();
	}

	async openCatalogue() {
		await this.catalogueButton.click();

		await expect(this.page.getByRole('heading', { name: 'Illustration catalogue' })).toBeVisible();

		// It slides in for a second: wait, so a snapshot doesn't catch it halfway.
		await this.catalogue.evaluate((element) =>
			Promise.all(element.getAnimations().map((animation) => animation.finished))
		);
	}

	/** Presses at one point and drags to another in small steps, as a hand would. */
	async drag(from: { x: number; y: number }, to: { x: number; y: number }, steps = 10) {
		await this.page.mouse.move(from.x, from.y);
		await this.page.mouse.down();
		for (let step = 1; step <= steps; step++) {
			await this.page.mouse.move(
				from.x + ((to.x - from.x) * step) / steps,
				from.y + ((to.y - from.y) * step) / steps
			);
		}
		await this.page.mouse.up();
	}

	/** Whether anything is drawn at this point of the page. */
	async inkAt(x: number, y: number) {
		return this.page.locator('canvas').evaluate(
			(element, point) => {
				const canvas = element as HTMLCanvasElement;
				const box = canvas.getBoundingClientRect();
				const scale = canvas.width / box.width;
				const [, , , alpha] = canvas
					.getContext('2d')!
					.getImageData((point.x - box.left) * scale, (point.y - box.top) * scale, 1, 1).data;
				return alpha > 0;
			},
			{ x, y }
		);
	}
}
