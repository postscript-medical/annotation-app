import { z } from 'zod';
import { accountEmail } from '#lib/server/account.ts';
import { actionFailure, ERROR_CODES, failAndLog } from '#lib/server/errors.ts';
import { requireUser } from '#lib/server/guards.ts';
import { loadAppState, saveAppState } from '#lib/server/repos/app-state.ts';
import { loadCatalogue } from '#lib/server/repos/catalogue.ts';
import { parseForm, uuidSchema } from '#lib/server/validation.ts';
import {
	findIllustrationPath,
	resolveSelection,
	selectionIds,
	type SelectionIds
} from '#lib/catalogue/selection.ts';
import type { Actions, PageServerLoad } from './$types';

// /annotate (2.3, 2.4): the catalogue, the caller's own selection, and the two actions that change
// it. Actions take ids, check them against the catalogue, and write only the caller's row (from
// `locals.profile`, auth-spec §7.1). No tutorial flag is stored or loaded. No Cache-Control here
// (see repos/catalogue.ts).

export const load: PageServerLoad = async (event) => {
	const { profile } = requireUser(event);
	const [catalogue, stored, email] = await Promise.all([
		loadCatalogue(),
		loadAppState(profile.userId),
		accountEmail(event)
	]);
	return {
		catalogue,
		// Normalised: ids no longer in the catalogue (or in the wrong place) are dropped.
		selection: selectionIds(resolveSelection(catalogue, stored)),
		// Only the first letter, for the user-menu button (legacy showed the same).
		accountInitial: email.charAt(0).toLocaleUpperCase('en')
	};
};

const specialtySchema = z.object({ specialtyId: uuidSchema });
const illustrationSchema = z.object({
	specialtyId: uuidSchema,
	subSpecialtyId: uuidSchema,
	illustrationId: uuidSchema
});

async function save(requestId: string, userId: string, ids: SelectionIds) {
	try {
		await saveAppState(userId, ids);
	} catch (cause) {
		return failAndLog('app_state_save_failed', cause, { requestId, userId });
	}
	return { selection: ids };
}

export const actions: Actions = {
	/** First visit: the specialty, with its first sub-specialty and no illustration yet. */
	chooseSpecialty: async (event) => {
		const { profile } = requireUser(event);
		const parsed = parseForm(specialtySchema, await event.request.formData());
		if (!parsed.ok) return actionFailure(ERROR_CODES.VALIDATION_FAILED);

		const catalogue = await loadCatalogue();
		const specialty = catalogue.find(({ id }) => id === parsed.data.specialtyId);
		if (!specialty) return actionFailure(ERROR_CODES.VALIDATION_FAILED);

		return save(event.locals.requestId, profile.userId, {
			specialtyId: specialty.id,
			subSpecialtyId: specialty.subSpecialties[0]?.id ?? null,
			illustrationId: null
		});
	},

	/** An illustration from the catalogue, with the specialty and sub-specialty it was found in. */
	chooseIllustration: async (event) => {
		const { profile } = requireUser(event);
		const parsed = parseForm(illustrationSchema, await event.request.formData());
		if (!parsed.ok) return actionFailure(ERROR_CODES.VALIDATION_FAILED);

		const path = findIllustrationPath(await loadCatalogue(), parsed.data);
		if (!path) return actionFailure(ERROR_CODES.VALIDATION_FAILED);

		return save(event.locals.requestId, profile.userId, selectionIds(path));
	}
};
