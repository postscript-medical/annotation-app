import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { HOME_PATH, chooseDevice, clientAddress, startSession } from '#lib/server/auth.ts';
import { actionFailure, failAndLog } from '#lib/server/errors.ts';
import { log } from '#lib/server/log.ts';
import { rateLimiter } from '#lib/server/rate-limit.ts';
import { clearCookieMode } from '#lib/server/supabase.ts';
import { checkboxSchema, parseForm } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

// The page every email link opens (auth-spec §4.1, scanner safety §1). GET only shows a
// "Continue" button and the device choice; the token is used only by the POST, so link
// scanners in mail systems can't use it up.

const linkSchema = z.object({
	token_hash: z.string().regex(/^[A-Za-z0-9_-]{8,256}$/),
	type: z.enum(['signup', 'recovery'])
});

export const load: PageServerLoad = ({ url }) => {
	const link = linkSchema.safeParse({
		token_hash: url.searchParams.get('token_hash'),
		type: url.searchParams.get('type')
	});
	return link.success
		? { valid: true as const, tokenHash: link.data.token_hash, type: link.data.type }
		: { valid: false as const };
};

export const actions: Actions = {
	default: async (event) => {
		const { requestId } = event.locals;
		if (!(await rateLimiter().consume('confirmIp', clientAddress(event)))) {
			log.warn('confirm_rate_limited', { requestId });
			return actionFailure('RATE_LIMITED');
		}

		const parsed = parseForm(
			linkSchema.extend({ shared: checkboxSchema }),
			await event.request.formData()
		);
		if (!parsed.ok) return actionFailure('LINK_INVALID');
		const { token_hash, type, shared } = parsed.data;

		const mode = shared ? 'shared' : 'personal';
		chooseDevice(event, mode);
		const { error } = await event.locals.supabase.auth.verifyOtp({ token_hash, type });
		if (error) {
			clearCookieMode(event);
			log.info('confirm_failed', { requestId, code: error.code ?? 'unknown' });
			return actionFailure('LINK_INVALID');
		}

		try {
			// Only this POST ever sets recovery_verified_at (auth-spec §4.1 step 2).
			await startSession(event, mode, { recovery: type === 'recovery' });
		} catch (cause) {
			return failAndLog('confirm_session_failed', cause, { requestId });
		}
		redirect(303, type === 'recovery' ? '/reset-password' : HOME_PATH);
	}
};
