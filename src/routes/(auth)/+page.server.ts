import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import {
	chooseDevice,
	clientAddress,
	nextPath,
	redirectIfSignedIn,
	startSession
} from '#lib/server/auth.ts';
import { actionFailure, failAndLog } from '#lib/server/errors.ts';
import { log } from '#lib/server/log.ts';
import { rateLimiter } from '#lib/server/rate-limit.ts';
import { clearCookieMode } from '#lib/server/supabase.ts';
import {
	checkboxSchema,
	currentPasswordSchema,
	emailSchema,
	parseForm,
	safeNextPath
} from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

// Sign-in, on the home page (auth-spec §4.1): email + password + "This is a shared device". One generic error for
// any failure; failed attempts count towards the per-email and per-network limits (§6).

const schema = z.object({
	email: emailSchema,
	password: currentPasswordSchema,
	shared: checkboxSchema,
	next: z.string().optional()
});

export const load: PageServerLoad = ({ url }) => ({
	next: safeNextPath(url.searchParams.get('next')),
	expired: url.searchParams.has('expired'),
	deleted: url.searchParams.has('deleted')
});

export const actions: Actions = {
	default: async (event) => {
		redirectIfSignedIn(event);
		const parsed = parseForm(schema, await event.request.formData());
		if (!parsed.ok) {
			return actionFailure('INVALID_CREDENTIALS', { fieldErrors: parsed.fieldErrors });
		}
		const { email, password, shared, next } = parsed.data;
		const limiter = rateLimiter();
		const ip = clientAddress(event);
		const { requestId } = event.locals;

		if (
			(await limiter.isLimited('signInEmail', email)) ||
			(await limiter.isLimited('signInIp', ip))
		) {
			log.warn('sign_in_rate_limited', { requestId });
			return actionFailure('INVALID_CREDENTIALS', { email });
		}

		const mode = shared ? 'shared' : 'personal';
		chooseDevice(event, mode);
		const { error } = await event.locals.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			clearCookieMode(event);
			await limiter.hit('signInEmail', email);
			await limiter.hit('signInIp', ip);
			// Wrong password, unknown address and unconfirmed address all look the same (§4.1).
			log.info('sign_in_failed', { requestId, code: error.code ?? 'unknown' });
			return actionFailure('INVALID_CREDENTIALS', { email });
		}

		try {
			await startSession(event, mode);
		} catch (cause) {
			return failAndLog('sign_in_session_failed', cause, { requestId });
		}
		redirect(303, nextPath(next));
	}
};
