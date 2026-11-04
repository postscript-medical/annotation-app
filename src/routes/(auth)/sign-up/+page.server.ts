import { z } from 'zod';
import { clientAddress, redirectIfSignedIn } from '#lib/server/auth.ts';
import { actionFailure, failAndLog } from '#lib/server/errors.ts';
import { log } from '#lib/server/log.ts';
import { checkNewPassword } from '#lib/server/password.ts';
import { rateLimiter } from '#lib/server/rate-limit.ts';
import { emailSchema, newPasswordSchema, parseForm } from '#lib/server/validation.ts';
import type { Actions } from './$types';

// Sign-up (auth-spec §4.1): email + password. A rejected password gets a specific reason; after
// that the answer is always "check your email", whether or not the address already has an
// account, and also when the network is over its sign-up limit (§6: nothing is sent then).

const schema = z.object({ email: emailSchema, password: newPasswordSchema });

/** Supabase errors that must look like success to the visitor. */
const QUIET_ERRORS = new Set([
	'user_already_exists',
	'email_exists',
	'over_email_send_rate_limit',
	'over_request_rate_limit'
]);

export const actions: Actions = {
	default: async (event) => {
		redirectIfSignedIn(event);
		const form = await event.request.formData();
		const parsed = parseForm(schema, form);
		const typedEmail = typeof form.get('email') === 'string' ? String(form.get('email')) : '';
		if (!parsed.ok) {
			return actionFailure('VALIDATION_FAILED', {
				fieldErrors: parsed.fieldErrors,
				email: typedEmail
			});
		}
		const { email } = parsed.data;
		const { requestId } = event.locals;

		const check = await checkNewPassword(parsed.data.password, { email });
		if (!check.ok) {
			return actionFailure('VALIDATION_FAILED', {
				fieldErrors: { password: check.message },
				email
			});
		}

		if (!(await rateLimiter().consume('signUpIp', clientAddress(event)))) {
			log.warn('sign_up_rate_limited', { requestId });
			return { sent: true, email };
		}

		const { error } = await event.locals.supabase.auth.signUp({ email, password: check.password });
		if (error) {
			if (!QUIET_ERRORS.has(error.code ?? ''))
				return failAndLog('sign_up_failed', error, { requestId });
			log.info('sign_up_quiet_error', { requestId, code: error.code });
		}
		return { sent: true, email };
	}
};
