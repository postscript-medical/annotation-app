import { redirectIfSignedIn, sendEmailLink } from '#lib/server/auth.ts';
import type { Actions } from './$types';

// Resend the sign-up confirmation (auth-spec §4.1): same answer whatever happens.
export const actions: Actions = {
	default: async (event) => {
		redirectIfSignedIn(event);
		return sendEmailLink(event, 'resend', (email) =>
			event.locals.supabase.auth.resend({ type: 'signup', email })
		);
	}
};
