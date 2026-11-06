import { redirect, type RequestEvent } from '@sveltejs/kit';
import { safeNextPath } from './validation';

/**
 * Route guards (auth-spec §7.2). Identity and scope come only from `locals`, set by
 * hooks.server.ts; no guard trusts a user or workspace id from the client (§7.1).
 *
 * The `(app)` layout calls `requireUser`, and so must every action and `+server.ts` handler:
 * SvelteKit runs actions without running the layout `load`.
 */
export type SignedIn = {
	session: NonNullable<App.Locals['session']>;
	profile: NonNullable<App.Locals['profile']>;
};

// The sign-in form is the home page.
export const SIGN_IN_PATH = '/';

/**
 * Where to come back to after signing in. A page's path and query for GET; only the path for
 * anything else, so an action (`?/name`) isn't re-submitted after sign-in.
 */
export function returnPath(event: Pick<RequestEvent, 'url' | 'request'>): string | null {
	const { pathname, search } = event.url;
	const method = event.request.method;
	const target = method === 'GET' || method === 'HEAD' ? pathname + search : pathname;
	const safe = safeNextPath(target);
	return safe && safe !== '/' ? safe : null;
}

/** The signed-in user, or a 303 to the sign-in form (`/?next=…`). */
export function requireUser(event: Pick<RequestEvent, 'locals' | 'url' | 'request'>): SignedIn {
	const { session, profile } = event.locals;
	if (!session || !profile) {
		const next = returnPath(event);
		redirect(303, next ? `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}` : SIGN_IN_PATH);
	}
	return { session, profile };
}
