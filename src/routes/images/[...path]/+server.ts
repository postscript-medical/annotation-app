import { error } from '@sveltejs/kit';
import { fetchImage } from '#lib/server/image-proxy.ts';
import { log } from '#lib/server/log.ts';
import type { RequestHandler } from './$types';

// Illustrations, thumbnails and the watermark, proxied from Cloudinary (G7, 2.4). Public, like the
// legacy /images/* rewrite: the hooks skip authentication for this path (hooks.server.ts).
export const GET: RequestHandler = async ({ params, locals }) => {
	const result = await fetchImage(params.path);
	if (!result.ok) {
		if (result.status === 502) {
			log.warn('image_proxy_failed', { requestId: locals.requestId, code: result.reason });
		}
		error(result.status, result.status === 404 ? 'Not found' : 'Image unavailable');
	}
	return new Response(result.body, { headers: result.headers });
};
