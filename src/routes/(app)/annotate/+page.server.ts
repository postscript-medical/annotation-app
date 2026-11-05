import { requireUser } from '#lib/server/guards.ts';
import { loadCatalogue } from '#lib/server/repos/catalogue.ts';
import type { PageServerLoad } from './$types';

// /annotate (2.3): the catalogue for the specialty and illustration pickers. The user's own state
// and the actions come in 2.4. No Cache-Control here (see repos/catalogue.ts).
export const load: PageServerLoad = async (event) => {
	requireUser(event);
	return { catalogue: await loadCatalogue() };
};
