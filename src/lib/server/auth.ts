import { redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { actionFailure } from './errors';
import { log } from './log';
import { rateLimiter } from './rate-limit';
import { ensureMembership, type SessionMode } from './session';
import { adminClient, clearCookieMode, setCookieMode } from './supabase';
import { emailSchema, parseForm, safeNextPath } from './validation';

/** Where people land after signing in (auth-spec §4.1). */
export const HOME_PATH = '/annotate';

/** The client address for rate limits (never stored or logged; rate-limit.ts hashes its prefix). */
export function clientAddress(event: Pick<RequestEvent, 'getClientAddress'>): string {
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

/** `next` from a form or the query string, limited to a path on this site. */
export function nextPath(value: unknown): string {
	return safeNextPath(value) ?? HOME_PATH;
}

/** Sign-in, sign-up and forgot-password are for signed-out visitors (auth-spec §7.3). */
export function redirectIfSignedIn(event: Pick<RequestEvent, 'locals'>) {
	if (event.locals.session && event.locals.profile) redirect(303, HOME_PATH);
}

/**
 * Call before the Supabase call that creates the session (signInWithPassword, verifyOtp), so its
 * auth cookies get the device choice's persistence.
 */
export function chooseDevice(event: RequestEvent, mode: SessionMode) {
	setCookieMode(event, mode);
}

/**
 * After Supabase has created a session on this request: the app account (ensure_account) and the
 * session_policies row (auth-spec §4.1). Without the row the hook signs the session out, so if
 * this fails the session is revoked here and the error is rethrown.
 * `recovery` marks a session from a password-reset link (only /auth/confirm passes it).
 */
export async function startSession(
	event: RequestEvent,
	mode: SessionMode,
	{ recovery = false }: { recovery?: boolean } = {}
): Promise<{ userId: string }> {
	const { data, error } = await event.locals.supabase.auth.getClaims();
	const authId = data?.claims.sub;
	const sessionId = data?.claims.session_id;
	if (error || typeof authId !== 'string' || typeof sessionId !== 'string') {
		throw new Error('no verified session after sign-in', { cause: error });
	}

	try {
		const admin = adminClient();
		const { userId } = await ensureMembership(admin, authId);
		const now = new Date().toISOString();
		const { error: insertError } = await admin.from('session_policies').insert({
			session_id: sessionId,
			user_id: userId,
			mode,
			created_at: now,
			last_seen_at: now,
			recovery_verified_at: recovery ? now : null
		});
		if (insertError) throw new Error('session policy insert failed', { cause: insertError });
		log.info(recovery ? 'recovery_session_started' : 'signed_in', {
			requestId: event.locals.requestId,
			userId,
			code: mode
		});
		return { userId };
	} catch (cause) {
		await event.locals.supabase.auth.signOut({ scope: 'local' });
		clearCookieMode(event);
		throw cause;
	}
}

/** Signs this session out and removes its policy row (auth-spec §4.2). */
export async function endSession(event: RequestEvent) {
	const sessionId = event.locals.session?.id;
	if (sessionId) {
		const { error } = await adminClient()
			.from('session_policies')
			.delete()
			.eq('session_id', sessionId);
		if (error) log.warn('policy_delete_failed', { requestId: event.locals.requestId }, error);
	}
	const { error } = await event.locals.supabase.auth.signOut({ scope: 'local' });
	if (error) log.warn('sign_out_failed', { requestId: event.locals.requestId }, error);
	clearCookieMode(event);
	log.info('signed_out', {
		requestId: event.locals.requestId,
		userId: event.locals.profile?.userId
	});
}

/**
 * Forgot password and resend confirmation (auth-spec §4.1, §6): email only, and the same answer
 * whether or not an account exists or a limit was hit (then nothing is sent). Failures to send
 * are logged, never shown.
 */
export async function sendEmailLink(
	event: RequestEvent,
	kind: 'reset' | 'resend',
	send: (email: string) => Promise<{ error: { code?: string } | null }>
) {
	const parsed = parseForm(z.object({ email: emailSchema }), await event.request.formData());
	if (!parsed.ok) {
		return actionFailure('VALIDATION_FAILED', { fieldErrors: parsed.fieldErrors });
	}
	const { email } = parsed.data;
	const { requestId } = event.locals;
	const limiter = rateLimiter();
	const allowed =
		(await limiter.consume(kind === 'reset' ? 'resetEmail' : 'resendEmail', email)) &&
		(await limiter.consume(kind === 'reset' ? 'resetIp' : 'resendIp', clientAddress(event)));
	if (!allowed) {
		log.warn(`${kind}_rate_limited`, { requestId });
	} else {
		const { error } = await send(email);
		if (error) log.warn(`${kind}_send_failed`, { requestId, code: error.code ?? 'unknown' });
	}
	return { sent: true as const, email };
}

/** How long a recovery link's session may set a new password (auth-spec §4.1 step 3). */
export const RECOVERY_WINDOW_MS = 15 * 60 * 1000;

/**
 * Whether this session may use /reset-password: a recovery marker set by /auth/confirm in the
 * last 15 minutes, and a JWT `amr` with `otp`. Neither alone is enough: a sign-up confirmation
 * also gives `otp`, and the marker belongs to a session row (auth-spec §2, S14).
 */
export function canResetPassword(session: App.Locals['session'], now = new Date()): boolean {
	if (!session?.recoveryVerifiedAt || !session.amr.includes('otp')) return false;
	const age = now.getTime() - Date.parse(session.recoveryVerifiedAt);
	return age >= 0 && age < RECOVERY_WINDOW_MS;
}
