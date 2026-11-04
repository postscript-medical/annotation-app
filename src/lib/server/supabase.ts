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
 * `Max-Age` per session mode is set by the sign-in flows (1.10), not here.
 */
export function authCookieOptions(url: URL) {
	const localHttp =
		url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
	return { httpOnly: true, secure: !localHttp, sameSite: 'lax', path: '/' } as const;
}

/** Cookie read/write for `@supabase/ssr`, through SvelteKit's cookie API. */
export function cookieMethods(event: {
	cookies: Cookies;
	url: URL;
	setHeaders: RequestEvent['setHeaders'];
}): CookieMethodsServer {
	const forced = authCookieOptions(event.url);
	return {
		getAll: () => event.cookies.getAll(),
		setAll: (cookiesToSet, headers) => {
			for (const { name, value, options } of cookiesToSet) {
				event.cookies.set(name, value, { ...options, ...forced });
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
