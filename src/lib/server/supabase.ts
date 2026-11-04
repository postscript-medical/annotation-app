import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { Database } from '../types/db';
import { serverEnv } from './env';

export type Db = SupabaseClient<Database>;

/**
 * Flags forced onto every auth cookie (auth-spec §3.1). `@supabase/ssr` doesn't default to
 * httpOnly because it assumes a browser client, which this app doesn't have.
 *
 * `secure` is dropped only for plain-http localhost (dev server, `vite preview`, E2E), the same
 * exception SvelteKit makes; WebKit refuses Secure cookies over http even on localhost.
 * Persistence follows the session mode: see `cookieMethods`.
 */
export function authCookieOptions(url: URL) {
	const localHttp =
		url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
	return { httpOnly: true, secure: !localHttp, sameSite: 'lax', path: '/' } as const;
}

export type CookieMode = 'personal' | 'shared';

/**
 * Remembers the device choice for cookie persistence (auth-spec §3.1, §5): personal = 30 days,
 * shared = a browser-session cookie. Token refreshes rewrite the auth cookie inside getClaims(),
 * before the hook has looked up the session's policy, so the mode travels in its own cookie.
 * It only decides how long the browser keeps cookies; the server enforces each mode's limits
 * from session_policies, so a tampered value gains nothing.
 */
export const SESSION_MODE_COOKIE = 'ps_session_mode';
export const PERSONAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

type CookieEvent = {
	cookies: Cookies;
	url: URL;
	setHeaders: RequestEvent['setHeaders'];
	locals?: Partial<Pick<App.Locals, 'cookieMode'>>;
};

/** The mode for this response: set by a sign-in flow, else the cookie; unknown = shared. */
export function cookieModeFor(event: CookieEvent): CookieMode {
	const mode = event.locals?.cookieMode ?? event.cookies.get(SESSION_MODE_COOKIE);
	return mode === 'personal' ? 'personal' : 'shared';
}

/** Options for a cookie that should live as long as the session in this mode. */
export function persistentCookieOptions(event: CookieEvent) {
	const base = authCookieOptions(event.url);
	return cookieModeFor(event) === 'personal' ? { ...base, maxAge: PERSONAL_COOKIE_MAX_AGE } : base;
}

/**
 * Sets the device choice before a sign-in flow creates the session, so the auth cookies written
 * by that call get the right persistence; also stores it for later token refreshes.
 */
export function setCookieMode(
	event: CookieEvent & { locals: Partial<App.Locals> },
	mode: CookieMode
) {
	event.locals.cookieMode = mode;
	event.cookies.set(SESSION_MODE_COOKIE, mode, persistentCookieOptions(event));
}

export function clearCookieMode(event: CookieEvent) {
	event.cookies.delete(SESSION_MODE_COOKIE, { path: '/' });
}

/** Cookie read/write for `@supabase/ssr`, through SvelteKit's cookie API. */
export function cookieMethods(event: CookieEvent): CookieMethodsServer {
	return {
		getAll: () => event.cookies.getAll(),
		setAll: (cookiesToSet, headers) => {
			for (const { name, value, options } of cookiesToSet) {
				// A deletion keeps Max-Age 0; anything else gets our flags and the mode's lifetime.
				const { maxAge, expires, ...rest } = options;
				void expires;
				event.cookies.set(
					name,
					value,
					maxAge === 0
						? { ...rest, ...authCookieOptions(event.url), maxAge: 0 }
						: { ...rest, ...persistentCookieOptions(event) }
				);
			}
			// Cache-Control etc., so a response that sets auth cookies is never cached. Only the
			// first call per client carries headers.
			if (headers && Object.keys(headers).length > 0) event.setHeaders(headers);
		}
	};
}

/**
 * The per-request Supabase client, acting as the signed-in user (publishable key + the user's
 * session cookie). Build one per request in hooks.server.ts (1.8); never share it.
 */
export function createSsrClient(event: Pick<RequestEvent, 'cookies' | 'url' | 'setHeaders'>): Db {
	return createServerClient<Database>(
		serverEnv('SUPABASE_URL'),
		serverEnv('SUPABASE_PUBLISHABLE_KEY'),
		{
			cookieOptions: authCookieOptions(event.url),
			cookies: cookieMethods(event)
		}
	);
}

let admin: Db | undefined;

/**
 * The secret-key client. Bypasses RLS: use only behind a guard, for the signed-in user's own
 * rows, the account RPCs and the Admin API. It holds no session and never touches cookies.
 */
export function adminClient(): Db {
	admin ??= createClient<Database>(serverEnv('SUPABASE_URL'), serverEnv('SUPABASE_SECRET_KEY'), {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
	return admin;
}
