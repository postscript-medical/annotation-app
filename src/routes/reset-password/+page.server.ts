import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { HOME_PATH, canResetPassword } from '#lib/server/auth.ts';
import { actionFailure, failAndLog } from '#lib/server/errors.ts';
import { log } from '#lib/server/log.ts';
import { checkNewPassword } from '#lib/server/password.ts';
import { signOutOtherSessions } from '#lib/server/account.ts';
import { adminClient } from '#lib/server/supabase.ts';
import { newPasswordSchema, parseForm } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

// Set a new password after a recovery link (auth-spec §4.1 steps 3–4). Only a session whose
// recovery marker is under 15 minutes old and whose JWT amr has `otp`; anything else goes to
// /forgot-password. One use: the marker is cleared after a successful reset.

const FORGOT = '/forgot-password';
const schema = z.object({ password: newPasswordSchema });

export const load: PageServerLoad = ({ locals }) => {
	if (!canResetPassword(locals.session)) redirect(303, FORGOT);
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;
		const { session, profile, requestId } = locals;
		if (!session || !profile || !canResetPassword(session)) redirect(303, FORGOT);

		const parsed = parseForm(schema, await event.request.formData());
		if (!parsed.ok) return actionFailure('VALIDATION_FAILED', { fieldErrors: parsed.fieldErrors });

		const { data: userData, error: userError } = await locals.supabase.auth.getUser();
		if (userError || !userData.user)
			return failAndLog('reset_get_user_failed', userError, { requestId });
		const check = await checkNewPassword(parsed.data.password, { email: userData.user.email });
		if (!check.ok) {
			return actionFailure('VALIDATION_FAILED', { fieldErrors: { password: check.message } });
		}

		const { error } = await locals.supabase.auth.updateUser({ password: check.password });
		if (error) {
			if (error.code === 'same_password') {
				return actionFailure('VALIDATION_FAILED', {
					fieldErrors: { password: 'Choose a password you haven’t used for this account before.' }
				});
			}
			return failAndLog('reset_update_failed', error, { requestId, userId: profile.userId });
		}

		// Every other session ends; this one continues, with its marker cleared so the page can't
		// be used again.
		try {
			await signOutOtherSessions(event);
		} catch (cause) {
			return failAndLog('reset_cleanup_failed', cause, { requestId, userId: profile.userId });
		}
		const cleared = await adminClient()
			.from('session_policies')
			.update({ recovery_verified_at: null })
			.eq('session_id', session.id);
		if (cleared.error) {
			return failAndLog('reset_cleanup_failed', cleared.error, {
				requestId,
				userId: profile.userId
			});
		}

		log.info('password_reset', { requestId, userId: profile.userId });
		redirect(303, HOME_PATH);
	}
};
