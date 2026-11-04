import { httpError } from '#lib/server/errors.ts';
import { requireUser } from '#lib/server/guards.ts';
import { log } from '#lib/server/log.ts';
import { adminClient } from '#lib/server/supabase.ts';
import type { RequestHandler } from './$types';

// "Download my data" (auth-spec §4.3; rights of access and portability): export_account as a
// JSON attachment. POST, so it's never prefetched, cached or triggered by a link; SvelteKit's
// origin check applies to the form post. Only ever the caller's own account.

export const POST: RequestHandler = async (event) => {
	const { session, profile } = requireUser(event);
	const { data, error: rpcError } = await adminClient().rpc('export_account', {
		p_auth_id: session.authId
	});
	if (rpcError || !data) {
		log.error('export_failed', rpcError, {
			requestId: event.locals.requestId,
			userId: profile.userId
		});
		httpError('SERVER_ERROR', event.locals.requestId);
	}
	log.info('account_exported', { requestId: event.locals.requestId, userId: profile.userId });

	const day = new Date().toISOString().slice(0, 10);
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="postscript-account-${day}.json"`,
			'Cache-Control': 'no-store'
		}
	});
};
