/**
 * Response headers set on every response (migration-plan Phase 1, risk S9). The CSP itself comes
 * from `csp` in vite.config.ts, so SvelteKit can add nonces to its own scripts.
 */
export const SECURITY_HEADERS: Record<string, string> = {
	// Two years; covers staging.app.* under app.*. Not `preload`: that is hard to undo.
	'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	// Full URLs (which can hold a confirmation token) never leave the site.
	'Referrer-Policy': 'same-origin',
	'Permissions-Policy':
		'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), browsing-topics=()',
	// Legacy twin of CSP `frame-ancestors 'none'`.
	'X-Frame-Options': 'DENY',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-origin'
};

export function applySecurityHeaders(headers: Headers): void {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(name)) headers.set(name, value);
	}
}

/**
 * Request bodies are small form posts; no endpoint accepts an image (data-protection §2). The
 * limit backs that up and keeps oversized posts away from the handlers.
 */
export const MAX_BODY_BYTES = 64 * 1024;

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * A 411/413 response when a body is missing a length or too large, otherwise null.
 * Requests without Content-Length (chunked) are refused rather than read: browsers always send
 * it for forms, and an unknown length can't be checked before the handler reads the body.
 */
export function checkBodySize(request: Request): Response | null {
	if (!BODY_METHODS.has(request.method)) return null;
	const header = request.headers.get('content-length');
	if (header === null) {
		return request.body === null ? null : new Response('Length Required', { status: 411 });
	}
	const length = Number(header);
	if (!Number.isInteger(length) || length < 0) {
		return new Response('Bad Request', { status: 400 });
	}
	if (length > MAX_BODY_BYTES) return new Response('Payload Too Large', { status: 413 });
	return null;
}
