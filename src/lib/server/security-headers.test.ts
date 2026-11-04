import { describe, expect, it } from 'vitest';
import {
	MAX_BODY_BYTES,
	SECURITY_HEADERS,
	applySecurityHeaders,
	checkBodySize
} from './security-headers';

/** A POST as a browser sends it: a string body always comes with its Content-Length. */
function post(body: string | null, headers: Record<string, string> = {}) {
	const length: Record<string, string> =
		body === null ? {} : { 'content-length': String(Buffer.byteLength(body)) };
	return new Request('https://app.postscriptmedical.com/sign-in', {
		method: 'POST',
		body,
		headers: { ...length, ...headers }
	});
}

describe('applySecurityHeaders', () => {
	it('adds every header', () => {
		const headers = new Headers();
		applySecurityHeaders(headers);
		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			expect(headers.get(name)).toBe(value);
		}
		expect(headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
		expect(headers.get('Permissions-Policy')).toContain('camera=()');
	});

	it('keeps a value a route set on purpose', () => {
		const headers = new Headers({ 'Referrer-Policy': 'no-referrer' });
		applySecurityHeaders(headers);
		expect(headers.get('Referrer-Policy')).toBe('no-referrer');
	});
});

describe('checkBodySize', () => {
	it('lets GET and small posts through', () => {
		expect(checkBodySize(new Request('https://x.test/'))).toBeNull();
		expect(checkBodySize(post('email=a%40b.com'))).toBeNull();
		expect(checkBodySize(post('x'.repeat(MAX_BODY_BYTES)))).toBeNull();
	});

	it('refuses a body over the limit with 413', () => {
		const response = checkBodySize(post('x'.repeat(MAX_BODY_BYTES + 1)));
		expect(response?.status).toBe(413);
	});

	it('refuses a declared length over the limit without reading the body', () => {
		const response = checkBodySize(post('x', { 'content-length': String(10 * 1024 * 1024) }));
		expect(response?.status).toBe(413);
	});

	it('refuses a streamed body without a length (411)', () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('x'));
				controller.close();
			}
		});
		const request = new Request('https://x.test/', {
			method: 'POST',
			body: stream,
			// @ts-expect-error: Node's fetch needs duplex for streaming bodies.
			duplex: 'half'
		});
		expect(checkBodySize(request)?.status).toBe(411);
	});

	it('refuses a malformed length', () => {
		expect(checkBodySize(post('x', { 'content-length': 'abc' }))?.status).toBe(400);
	});

	it('allows a body-less POST (e.g. sign out)', () => {
		expect(checkBodySize(post(null))).toBeNull();
	});
});
