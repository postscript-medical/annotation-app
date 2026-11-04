import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import type { Database } from '../types/db';
import { serverEnv } from './env';
import { log } from './log';
import { rateLimiter } from './rate-limit';
import { adminClient, clearCookieMode } from './supabase';

/**
 * Account page helpers (auth-spec §4.3). Everything acts on the caller's own account, identified
 * only by `locals` (no user or session id from the client is trusted, §7.1).
 */

/** The signed-in user's email address, from Supabase Auth (we store no copy, data-model §1.3). */
export async function accountEmail(event: RequestEvent): Promise<string> {
	const { data, error } = await event.locals.supabase.auth.getUser();
	if (error || !data.user?.email) throw new Error('account email lookup failed', { cause: error });
	return data.user.email;
}

/**
 * Checks the current password with a throwaway client whose session is revoked at once
 * (auth-spec §4.3), so it never touches this request's cookies. Failures count towards the
 * same per-address limit as sign-in (§6), so a borrowed session can't be used to guess it.
 */
export async function verifyCurrentPassword(
	event: RequestEvent,
	email: string,
	password: string
): Promise<boolean> {
	const limiter = rateLimiter();
	if (await limiter.isLimited('signInEmail', email)) {
		log.warn('current_password_rate_limited', { requestId: event.locals.requestId });
		return false;
	}
	const throwaway = createClient<Database>(
		serverEnv('SUPABASE_URL'),
		serverEnv('SUPABASE_PUBLISHABLE_KEY'),
		{ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
	);
	const { error } = await throwaway.auth.signInWithPassword({ email, password });
	if (error) {
		await limiter.hit('signInEmail', email);
		log.info('current_password_rejected', {
			requestId: event.locals.requestId,
			userId: event.locals.profile?.userId,
			code: error.code ?? 'unknown'
		});
		return false;
	}
	const { error: signOutError } = await throwaway.auth.signOut({ scope: 'local' });
	if (signOutError) {
		log.warn('throwaway_sign_out_failed', { requestId: event.locals.requestId }, signOutError);
	}
	return true;
}

/** Removes every auth cookie from this browser (after the account or all sessions are gone). */
export function clearAuthCookies(event: RequestEvent) {
	for (const { name } of event.cookies.getAll()) {
		if (name.startsWith('sb-')) event.cookies.delete(name, { path: '/' });
	}
	clearCookieMode(event);
}

/**
 * Signs every other session out (Supabase revokes them; we delete their policy rows). Used after
 * a password change or reset.
 */
export async function signOutOtherSessions(event: RequestEvent) {
	const { session, profile, requestId } = event.locals;
	if (!session || !profile) return;
	const { error } = await event.locals.supabase.auth.signOut({ scope: 'others' });
	if (error) log.warn('sign_out_others_failed', { requestId }, error);
	const { error: deleteError } = await adminClient()
		.from('session_policies')
		.delete()
		.eq('user_id', profile.userId)
		.neq('session_id', session.id);
	if (deleteError) throw new Error('other policy rows delete failed', { cause: deleteError });
}
