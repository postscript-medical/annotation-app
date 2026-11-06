import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { accountEmail, clearAuthCookies, verifyCurrentPassword } from '#lib/server/account.ts';
import { endSession } from '#lib/server/auth.ts';
import { actionFailure, failAndLog, httpError } from '#lib/server/errors.ts';
import { requireUser } from '#lib/server/guards.ts';
import { log } from '#lib/server/log.ts';
import { adminClient } from '#lib/server/supabase.ts';
import {
	currentPasswordSchema,
	emailSchema,
	parseForm,
	uuidSchema
} from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

// The account page (auth-spec §4.3): email, sessions, sign out one or all, delete the account.
// Every action calls requireUser itself (the layout guard doesn't run for actions, §7.2).

export const load: PageServerLoad = async (event) => {
	const { session, profile } = requireUser(event);
	const { data: sessions, error } = await adminClient()
		.from('session_policies')
		.select('session_id, mode, created_at, last_seen_at')
		.eq('user_id', profile.userId)
		.order('created_at', { ascending: false });
	if (error) throw new Error('sessions lookup failed', { cause: error });

	return {
		email: await accountEmail(event),
		sessions: sessions.map((row) => ({
			id: row.session_id,
			mode: row.mode,
			createdAt: row.created_at,
			lastSeenAt: row.last_seen_at,
			current: row.session_id === session.id
		})),
		passwordChanged: event.url.searchParams.has('password-changed')
	};
};

export const actions: Actions = {
	/** Ends one of the caller's sessions; someone else's session id is a 404 (§7.3). */
	signOutSession: async (event) => {
		const { session, profile } = requireUser(event);
		const parsed = parseForm(z.object({ sessionId: uuidSchema }), await event.request.formData());
		if (!parsed.ok) httpError('NOT_FOUND', event.locals.requestId);
		const { sessionId } = parsed.data;

		if (sessionId === session.id) {
			await endSession(event);
			redirect(303, '/');
		}
		const { data: revoked, error } = await adminClient().rpc('revoke_session', {
			p_user_id: profile.userId,
			p_session_id: sessionId
		});
		if (error) {
			return failAndLog('revoke_session_failed', error, {
				requestId: event.locals.requestId,
				userId: profile.userId
			});
		}
		if (!revoked) httpError('NOT_FOUND', event.locals.requestId);
		log.info('session_revoked', { requestId: event.locals.requestId, userId: profile.userId });
		return { revoked: true };
	},

	/** Signs out every session, this one included (auth-spec §4.2). */
	signOutEverywhere: async (event) => {
		const { profile } = requireUser(event);
		const { requestId } = event.locals;
		const { error } = await event.locals.supabase.auth.signOut({ scope: 'global' });
		if (error) log.warn('sign_out_global_failed', { requestId }, error);
		const { error: deleteError } = await adminClient()
			.from('session_policies')
			.delete()
			.eq('user_id', profile.userId);
		if (deleteError) {
			return failAndLog('sign_out_everywhere_failed', deleteError, {
				requestId,
				userId: profile.userId
			});
		}
		clearAuthCookies(event);
		log.info('signed_out_everywhere', { requestId, userId: profile.userId });
		redirect(303, '/');
	},

	/**
	 * Deletes the account: current password and the email address typed (auth-spec §4.3), then
	 * Admin deleteUser; the foreign keys remove everything else (data-model §5.4).
	 */
	delete: async (event) => {
		const { session, profile } = requireUser(event);
		const { requestId } = event.locals;
		const form = await event.request.formData();
		const parsed = parseForm(
			z.object({ password: currentPasswordSchema, confirmEmail: emailSchema }),
			form
		);
		if (!parsed.ok) {
			return actionFailure('VALIDATION_FAILED', { deleteErrors: parsed.fieldErrors });
		}
		const email = await accountEmail(event);
		if (parsed.data.confirmEmail !== email.toLowerCase()) {
			return actionFailure('VALIDATION_FAILED', {
				deleteErrors: { confirmEmail: 'Type the email address of this account.' }
			});
		}
		if (!(await verifyCurrentPassword(event, email, parsed.data.password))) {
			return actionFailure('VALIDATION_FAILED', {
				deleteErrors: { password: 'That isn’t your current password.' }
			});
		}

		const { error } = await adminClient().auth.admin.deleteUser(session.authId);
		if (error)
			return failAndLog('account_delete_failed', error, { requestId, userId: profile.userId });
		clearAuthCookies(event);
		log.info('account_deleted', { requestId, userId: profile.userId });
		redirect(303, '/?deleted=1');
	}
};
