import { redirectIfSignedIn } from '#lib/server/auth.ts';
import type { LayoutServerLoad } from './$types';

// Sign-in, sign-up, forgot-password and resend-confirmation are for signed-out visitors;
// a signed-in user goes to the app (auth-spec §7.3).
export const load: LayoutServerLoad = (event) => {
	redirectIfSignedIn(event);
	return {};
};
