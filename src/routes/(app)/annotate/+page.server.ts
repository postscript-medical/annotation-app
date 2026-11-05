import { z } from 'zod';
import { accountEmail } from '#lib/server/account.ts';
import { feedbackMail, feedbackRecipient, sendMail } from '#lib/server/email.ts';
import { actionFailure, ERROR_CODES, failAndLog } from '#lib/server/errors.ts';
import { requireUser } from '#lib/server/guards.ts';
import { log } from '#lib/server/log.ts';
import { rateLimiter } from '#lib/server/rate-limit.ts';
import { loadAppState, saveAppState } from '#lib/server/repos/app-state.ts';
import { loadCatalogue } from '#lib/server/repos/catalogue.ts';
import { parseForm, uuidSchema } from '#lib/server/validation.ts';
import { FEEDBACK_MAX_LENGTH } from '#lib/feedback.ts';
import {
	findIllustrationPath,
	resolveSelection,
	selectionIds,
	type SelectionIds
} from '#lib/catalogue/selection.ts';
import type { Actions, PageServerLoad } from './$types';

// /annotate (2.3, 2.4, 2.6): the catalogue, the caller's own selection, the two actions that change
// it, and feedback to staff. Actions take ids, check them against the catalogue, and write only the caller's row (from
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

/** Feedback text: trimmed, 1–5,000 characters. */
const feedbackSchema = z.object({
	message: z
		.string()
		.trim()
		.min(1, 'Please write a message.')
		.max(FEEDBACK_MAX_LENGTH, {
			error: `Please keep it under ${FEEDBACK_MAX_LENGTH.toLocaleString('en')} characters.`
		})
});
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
	},

	/**
	 * Feedback to staff by email (2.6), with the account email as reply-to. 5 per user per day
	 * (auth-spec §6): every valid message counts, sent or not, so failures can't be used to
	 * retry past the limit.
	 */
	feedback: async (event) => {
		const { profile } = requireUser(event);
		const { requestId } = event.locals;
		const parsed = parseForm(feedbackSchema, await event.request.formData());
		if (!parsed.ok) {
			return actionFailure(ERROR_CODES.VALIDATION_FAILED, { fieldErrors: parsed.fieldErrors });
		}

		if (!(await rateLimiter().consume('feedbackUser', profile.userId))) {
			log.warn('feedback_rate_limited', { requestId, userId: profile.userId });
			return actionFailure(ERROR_CODES.RATE_LIMITED, undefined, requestId);
		}

		try {
			const mail = feedbackMail({
				to: feedbackRecipient(),
				accountEmail: await accountEmail(event),
				message: parsed.data.message
			});
			await sendMail(mail);
		} catch (cause) {
			return failAndLog('feedback_send_failed', cause, { requestId, userId: profile.userId });
		}
		log.info('feedback_sent', { requestId, userId: profile.userId });
		return { sent: true };
	}
};
