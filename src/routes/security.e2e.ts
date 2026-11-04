import { expect, test } from '@playwright/test';

// Security headers and CSP on the production build (hooks.server.ts, vite.config.ts `csp`).

test('sends the CSP and security headers', async ({ request }) => {
	const response = await request.get('/');
	expect(response.status()).toBe(200);
	const headers = response.headers();

	const csp = headers['content-security-policy'];
	expect(csp).toBeDefined();
	const directives = Object.fromEntries(
		csp.split(';').map((part) => {
			const [name, ...values] = part.trim().split(/\s+/);
			return [name, values];
		})
	);
	expect(directives['default-src']).toEqual(["'self'"]);
	expect(directives['connect-src']).toEqual(["'self'"]);
	expect(directives['frame-ancestors']).toEqual(["'none'"]);
	expect(directives['object-src']).toEqual(["'none'"]);
	expect(directives['base-uri']).toEqual(["'none'"]);
	expect(directives['form-action']).toEqual(["'self'"]);
	// Scripts: our origin plus a per-response nonce; never unsafe-inline or unsafe-eval.
	expect(directives['script-src']).toContain("'self'");
	expect(directives['script-src'].some((v: string) => v.startsWith("'nonce-"))).toBe(true);
	expect(csp).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);

	expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');
	expect(headers['x-content-type-options']).toBe('nosniff');
	expect(headers['referrer-policy']).toBe('same-origin');
	expect(headers['x-frame-options']).toBe('DENY');
	expect(headers['permissions-policy']).toContain('camera=()');
	expect(headers['cross-origin-opener-policy']).toBe('same-origin');
});

test('uses a fresh nonce on every response', async ({ request }) => {
	const nonce = async () =>
		/'nonce-([^']+)'/.exec((await request.get('/')).headers()['content-security-policy'])?.[1];
	const [a, b] = [await nonce(), await nonce()];
	expect(a).toBeTruthy();
	expect(a).not.toBe(b);
});

test('the page runs with no CSP violations', async ({ page }) => {
	const violations: string[] = [];
	page.on('console', (message) => {
		if (/Content Security Policy|Refused to/i.test(message.text())) violations.push(message.text());
	});
	await page.addInitScript(() => {
		document.addEventListener('securitypolicyviolation', (event) => {
			console.error(`Refused to load: CSP ${event.violatedDirective} ${event.blockedURI}`);
		});
	});
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('PostScript Medical');
	await page.evaluate(() => document.fonts.ready);
	expect(violations).toEqual([]);
});

test('refuses a cross-site form post (SvelteKit CSRF check)', async ({ request }) => {
	const response = await request.post('/', {
		data: 'x=1',
		headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' }
	});
	expect(response.status()).toBe(403);
});

test('refuses an oversized same-origin request body', async ({ request, baseURL }) => {
	const response = await request.post('/', {
		data: 'x'.repeat(70 * 1024),
		headers: { 'content-type': 'text/plain', origin: new URL(baseURL!).origin }
	});
	expect(response.status()).toBe(413);
});
