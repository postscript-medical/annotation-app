import type { Page } from '@playwright/test';

// Nothing here may import tests/e2e/support.ts: that needs the local stack.

/** Everything the page asks for from anywhere else, and every CSP report or page error. */
export function watch(page: Page, baseURL: string) {
	const origin = new URL(baseURL).origin;
	const thirdParty: string[] = [];
	const problems: string[] = [];
	page.on('request', (request) => {
		const url = request.url();
		if (!url.startsWith(origin) && !/^(data|blob):/.test(url)) thirdParty.push(url);
	});
	page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
	page.on('console', (message) => {
		if (/Content Security Policy|Refused to/i.test(message.text())) problems.push(message.text());
	});
	return { thirdParty, problems };
}
