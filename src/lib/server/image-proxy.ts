/**
 * The Cloudinary image proxy behind /images/[...path] (G7, 2.4). The legacy Netlify rewrite of
 * /images/* is shadowed by the SvelteKit function (1.2), so the app serves the same paths itself.
 * Only the path shapes the app uses are allowed, and only this one Cloudinary account is ever
 * contacted, so the route can't be used to fetch anything else.
 */

export const UPSTREAM = 'https://res.cloudinary.com/postscript-medical/image/upload/q_auto:eco/';

const FILE = '[A-Za-z0-9][A-Za-z0-9_.-]*\\.(?:jpe?g|png)';
const ALLOWED = [
	new RegExp(`^annotation-app/illustrations/${FILE}$`),
	new RegExp(`^c_thumb,h_220,w_180/annotation-app/illustrations/${FILE}$`),
	/^annotation-app\/postscript-logo-raster\.png$/
];

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

/** Upstream images are a few hundred KB at most; refuse anything far larger. */
export const MAX_BYTES = 5 * 1024 * 1024;

const TIMEOUT_MS = 10_000;

export function isAllowedPath(path: string): boolean {
	return ALLOWED.some((pattern) => pattern.test(path));
}

// Browsers keep an image a day; Netlify's CDN keeps it a year and serves it stale while it
// refreshes. Illustrations change only by uploading a new public ID (data-model §3.3).
const CACHE_HEADERS = {
	'cache-control': 'public, max-age=86400',
	'netlify-cdn-cache-control': 'public, durable, max-age=31536000, stale-while-revalidate=86400'
};

export type ProxyResult =
	| { ok: true; body: ReadableStream<Uint8Array>; headers: Record<string, string> }
	| { ok: false; status: 404 | 502; reason: string };

export async function fetchImage(
	path: string,
	fetcher: typeof fetch = fetch
): Promise<ProxyResult> {
	if (!isAllowedPath(path)) return { ok: false, status: 404, reason: 'path_not_allowed' };

	let response: Response;
	try {
		response = await fetcher(UPSTREAM + path, {
			redirect: 'error',
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch {
		return { ok: false, status: 502, reason: 'upstream_unreachable' };
	}

	if (response.status === 404) return { ok: false, status: 404, reason: 'upstream_not_found' };
	if (!response.ok || !response.body) {
		return { ok: false, status: 502, reason: `upstream_${response.status}` };
	}

	const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
	if (!IMAGE_TYPES.has(type)) return { ok: false, status: 502, reason: 'upstream_not_an_image' };

	const length = Number(response.headers.get('content-length') ?? NaN);
	if (Number.isFinite(length) && length > MAX_BYTES) {
		return { ok: false, status: 502, reason: 'upstream_too_large' };
	}

	const headers: Record<string, string> = { 'content-type': type, ...CACHE_HEADERS };
	if (Number.isFinite(length)) headers['content-length'] = String(length);
	return { ok: true, body: limitBytes(response.body, MAX_BYTES), headers };
}

/** Passes a stream through, erroring it if it grows past `max` bytes (no content-length case). */
function limitBytes(body: ReadableStream<Uint8Array>, max: number): ReadableStream<Uint8Array> {
	let seen = 0;
	return body.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				seen += chunk.byteLength;
				if (seen > max) controller.error(new Error('upstream image too large'));
				else controller.enqueue(chunk);
			}
		})
	);
}
