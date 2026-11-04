import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { messageFor, newRequestId, toClientError } from './lib/server/errors';
import { log } from './lib/server/log';
import { applySecurityHeaders, checkBodySize } from './lib/server/security-headers';
import {
	amrMethods,
	deleteSessionPolicy,
	ensureMembership,
	evaluateSession,
	loadSession,
	touchSession
} from './lib/server/session';
import { adminClient, createSsrClient, type Db } from './lib/server/supabase';

/**
 * Request pipeline (auth-spec §3.2):
 * body limit → SSR client → getClaims() → session policy (§5) → locals.profile → headers.
 * The clients and clock are injectable so integration tests can drive the real hook.
 */
export type HookDeps = {
	ssrClient: (event: RequestEvent) => Db;
	admin: () => Db;
	now: () => Date;
};

export const EXPIRED_REDIRECT = '/sign-in?expired=1';

async function signOutQuietly(event: RequestEvent, reason: string) {
	const { error } = await event.locals.supabase.auth.signOut({ scope: 'local' });
	// Already revoked or expired is fine: the cookies are cleared either way.
	log.info('signed_out_by_hook', { requestId: event.locals.requestId, code: reason });
	if (error) log.warn('sign_out_failed', { requestId: event.locals.requestId }, error);
}

async function authenticate(event: RequestEvent, deps: HookDeps) {
	const { locals } = event;
	const { data, error } = await locals.supabase.auth.getClaims();
	if (error) {
		// A bad or unrefreshable token: drop it.
		await signOutQuietly(event, 'invalid_claims');
		return;
	}
	if (!data) return;

	const { sub: authId, session_id: sessionId } = data.claims;
	if (typeof authId !== 'string' || typeof sessionId !== 'string') {
		await signOutQuietly(event, 'claims_incomplete');
		return;
	}

	const admin = deps.admin();
	const record = await loadSession(admin, sessionId);
	// No policy row: revoked elsewhere, account deleted, or created outside our flows.
	if (!record || record.authId !== authId) {
		await signOutQuietly(event, record ? 'session_user_mismatch' : 'no_session_policy');
		return;
	}

	const now = deps.now();
	const verdict = evaluateSession(
		{ mode: record.mode, created_at: record.createdAt, last_seen_at: record.lastSeenAt },
		now
	);
	if (verdict === 'expired') {
		await deleteSessionPolicy(admin, sessionId);
		await signOutQuietly(event, 'session_expired');
		if (event.url.pathname !== '/sign-in') redirect(303, EXPIRED_REDIRECT);
		return;
	}
	if (verdict === 'touch') {
		try {
			await touchSession(admin, sessionId, now);
		} catch (cause) {
			log.warn('touch_session_failed', { requestId: locals.requestId }, cause);
		}
	}

	// A policy row implies a users row; a missing membership is repaired (auth-spec §3.2 step 4).
	const membership = record.membership
		? {
				userId: record.userId,
				workspaceId: record.membership.workspaceId,
				role: record.membership.role
			}
		: await ensureMembership(admin, authId);

	locals.session = {
		id: sessionId,
		authId,
		mode: record.mode,
		amr: amrMethods(data.claims.amr),
		recoveryVerifiedAt: record.recoveryVerifiedAt
	};
	locals.profile = {
		userId: membership.userId,
		workspaceId: membership.workspaceId,
		workspaceRole: membership.role
	};
}

export function createHandle(deps: HookDeps): Handle {
	return async ({ event, resolve }) => {
		event.locals.requestId = newRequestId();
		event.locals.session = null;
		event.locals.profile = null;

		const refused = checkBodySize(event.request);
		if (refused) {
			applySecurityHeaders(refused.headers);
			return refused;
		}

		event.locals.supabase = deps.ssrClient(event);
		await authenticate(event, deps);

		const response = await resolve(event);
		applySecurityHeaders(response.headers);
		return response;
	};
}

export const handle = createHandle({
	ssrClient: createSsrClient,
	admin: adminClient,
	now: () => new Date()
});

/**
 * Every error except redirects. `app` errors (thrown with `error()`, e.g. via `httpError`) and
 * `framework` errors (unknown routes, bad methods) are expected: they keep their status and
 * message and get a request id. Anything `unknown` is logged and replaced by a generic body.
 */
export const handleError: HandleServerError = (input) => {
	const { event } = input;
	const requestId = event.locals.requestId ?? newRequestId();
	switch (input.kind) {
		case 'app':
			return { code: input.error.code, requestId };
		case 'framework':
			// Keep SvelteKit's status and safe message, except for a friendlier 404.
			return input.error.status === 404
				? { code: 'NOT_FOUND', message: messageFor('NOT_FOUND'), requestId }
				: { requestId };
		case 'validation':
			return { code: 'VALIDATION_FAILED', message: messageFor('VALIDATION_FAILED'), requestId };
		default:
			return toClientError(input.error, {
				requestId,
				route: event.route.id ?? undefined,
				method: event.request.method,
				userId: event.locals.profile?.userId
			});
	}
};
