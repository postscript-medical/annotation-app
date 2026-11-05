import { describe, expect, it, vi } from 'vitest';
import { illustrationUrl, thumbnailUrl, WATERMARK_URL } from '../images';
import { fetchImage, isAllowedPath, MAX_BYTES, UPSTREAM } from './image-proxy';

const FULL = 'annotation-app/illustrations/vagus_nerve.jpg';

function upstream(body: BodyInit | null, init: ResponseInit = {}) {
	return vi.fn(async () => new Response(body, init));
}

async function text(stream: ReadableStream<Uint8Array>) {
	return new Response(stream).text();
}

describe('isAllowedPath', () => {
	it.each([
		FULL,
		'annotation-app/illustrations/Ulcerative-colitis.2.png',
		'c_thumb,h_220,w_180/annotation-app/illustrations/vagus_nerve.jpg',
		'annotation-app/postscript-logo-raster.png'
	])('allows %s', (path) => {
		expect(isAllowedPath(path)).toBe(true);
	});

	it.each([
		'',
		'annotation-app/illustrations/',
		'annotation-app/illustrations/../secret.jpg',
		'annotation-app/illustrations/a/b.jpg',
		'annotation-app/illustrations/.hidden.jpg',
		'annotation-app/illustrations/x.svg',
		'annotation-app/illustrations/x.jpg?x=1',
		'c_scale,w_5000/annotation-app/illustrations/vagus_nerve.jpg',
		'annotation-app/other.png',
		'other-folder/vagus_nerve.jpg',
		'https://evil.example/x.jpg',
		'//evil.example/x.jpg'
	])('refuses %j', (path) => {
		expect(isAllowedPath(path)).toBe(false);
	});

	it('allows every URL the app builds', () => {
		const strip = (url: string) => url.replace(/^\/images\//, '');

		expect(isAllowedPath(strip(illustrationUrl('vagus_nerve.jpg')))).toBe(true);
		expect(isAllowedPath(strip(thumbnailUrl('vagus_nerve.jpg')))).toBe(true);
		expect(isAllowedPath(strip(WATERMARK_URL))).toBe(true);
	});
});

describe('fetchImage', () => {
	it('fetches only from the fixed Cloudinary prefix, refusing redirects', async () => {
		const fetcher = upstream('jpeg-bytes', { headers: { 'content-type': 'image/jpeg' } });

		const result = await fetchImage(FULL, fetcher);

		expect(fetcher).toHaveBeenCalledWith(
			UPSTREAM + FULL,
			expect.objectContaining({ redirect: 'error' })
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(await text(result.body)).toBe('jpeg-bytes');
		expect(result.headers['content-type']).toBe('image/jpeg');
		expect(result.headers['cache-control']).toMatch(/^public, max-age=\d+$/);
		expect(result.headers['netlify-cdn-cache-control']).toMatch(/durable/);
	});

	it('never contacts upstream for a refused path', async () => {
		const fetcher = upstream('x');

		expect(await fetchImage('../etc/passwd', fetcher)).toMatchObject({ ok: false, status: 404 });
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('passes a 404 through', async () => {
		expect(await fetchImage(FULL, upstream(null, { status: 404 }))).toMatchObject({
			ok: false,
			status: 404
		});
	});

	it.each([
		['an upstream error', upstream('oops', { status: 500 })],
		['a non-image', upstream('<html>', { headers: { 'content-type': 'text/html' } })],
		[
			'a declared size over the limit',
			upstream('x', {
				headers: { 'content-type': 'image/png', 'content-length': String(MAX_BYTES + 1) }
			})
		],
		[
			'a network failure',
			vi.fn(async () => {
				throw new TypeError('fetch failed');
			})
		]
	])('gives 502 for %s', async (_label, fetcher) => {
		expect(await fetchImage(FULL, fetcher)).toMatchObject({ ok: false, status: 502 });
	});

	it('cuts off a body that grows past the limit without a content-length', async () => {
		const big = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new Uint8Array(MAX_BYTES));
				controller.enqueue(new Uint8Array(1));
				controller.close();
			}
		});
		const result = await fetchImage(
			FULL,
			upstream(big, { headers: { 'content-type': 'image/jpeg' } })
		);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		await expect(text(result.body)).rejects.toThrow(/too large/);
	});
});
