import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { accountEmail, signOutOtherSessions, verifyCurrentPassword } from '#lib/server/account.ts';
import { actionFailure, failAndLog } from '#lib/server/errors.ts';
import { requireUser } from '#lib/server/guards.ts';
import { log } from '#lib/server/log.ts';
import { checkNewPassword } from '#lib/server/password.ts';
import { currentPasswordSchema, newPasswordSchema, parseForm } from '#lib/server/validation.ts';
import type { Actions } from './$types';

// Change password (auth-spec §4.3): the current password (checked with a throwaway client), a new
// one through the policy (§1), then every other session is signed out. This one continues.

const schema = z.object({ currentPassword: currentPasswordSchema, newPassword: newPasswordSchema });

export const actions: Actions = {
	default: async (event) => {
		const { profile } = requireUser(event);
		const { requestId } = event.locals;
		const parsed = parseForm(schema, await event.request.formData());
		if (!parsed.ok) return actionFailure('VALIDATION_FAILED', { fieldErrors: parsed.fieldErrors });
		const { currentPassword, newPassword } = parsed.data;

		const email = await accountEmail(event);
		if (!(await verifyCurrentPassword(event, email, currentPassword))) {
			return actionFailure('VALIDATION_FAILED', {
				fieldErrors: { currentPassword: 'That isn’t your current password.' }
			});
		}
		const check = await checkNewPassword(newPassword, { email });
		if (!check.ok) {
			return actionFailure('VALIDATION_FAILED', { fieldErrors: { newPassword: check.message } });
		}

		const { error } = await event.locals.supabase.auth.updateUser({ password: check.password });
		if (error) {
			if (error.code === 'same_password') {
				return actionFailure('VALIDATION_FAILED', {
					fieldErrors: { newPassword: 'Choose a password different from your current one.' }
				});
			}
			return failAndLog('password_change_failed', error, { requestId, userId: profile.userId });
		}
		try {
			await signOutOtherSessions(event);
		} catch (cause) {
			return failAndLog('password_change_cleanup_failed', cause, {
				requestId,
				userId: profile.userId
			});
		}
		log.info('password_changed', { requestId, userId: profile.userId });
		redirect(303, '/account?password-changed=1');
	}
};
