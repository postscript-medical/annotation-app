import { requireUser } from '#lib/server/guards.ts';
import type { LayoutServerLoad } from './$types';

// Every page in the (app) group needs a signed-in user (auth-spec §7.2). Actions don't run this
// load, so each action calls requireUser itself. Nothing about the user is sent to the page here;
// pages load what they need.
export const load: LayoutServerLoad = (event) => {
	requireUser(event);
	return {};
};
