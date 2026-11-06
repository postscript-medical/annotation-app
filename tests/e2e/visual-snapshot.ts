import { test, type Page } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * A Percy snapshot; does nothing outside `percy exec`. Taken on Chromium only: Percy renders the
 * captured DOM in its own browsers, and rejects a second snapshot with the same name, which a
 * run on both Playwright projects would produce.
 */
export async function visualSnapshot(page: Page, name: string) {
	if (test.info().project.name !== 'chromium') return;
	await page.waitForLoadState('networkidle');
	await percySnapshot(page, name);
}
