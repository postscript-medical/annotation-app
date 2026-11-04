import { redirectIfSignedIn, sendEmailLink } from '#lib/server/auth.ts';
import type { Actions } from './$types';

// Forgot password (auth-spec §4.1): the Recovery email links to /auth/confirm (type=recovery).
export const actions: Actions = {
	default: async (event) => {
		redirectIfSignedIn(event);
		return sendEmailLink(event, 'reset', (email) =>
			event.locals.supabase.auth.resetPasswordForEmail(email)
		);
	}
};
