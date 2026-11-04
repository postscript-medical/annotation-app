import { redirect } from '@sveltejs/kit';
import { endSession } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

// Sign out (auth-spec §4.2): a POST form action only, so a link or an image can't sign anyone
// out. Visiting /logout just goes home.

export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.session) redirect(303, '/sign-in');
		await endSession(event);
		redirect(303, '/sign-in');
	}
};
