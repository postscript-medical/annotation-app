import type { Catalogue, Illustration, Specialty, SubSpecialty } from './types';

/** What a user has chosen on /annotate, by id (`user_app_states`). */
export interface SelectionIds {
	specialtyId: string | null;
	subSpecialtyId: string | null;
	illustrationId: string | null;
}

export interface ResolvedSelection {
	specialty: Specialty | null;
	subSpecialty: SubSpecialty | null;
	illustration: Illustration | null;
}

export const NO_SELECTION: SelectionIds = {
	specialtyId: null,
	subSpecialtyId: null,
	illustrationId: null
};

/**
 * Resolves stored ids against the catalogue, leniently: an unknown specialty clears everything; a
 * sub-specialty outside the specialty falls back to the specialty's first; an illustration
 * outside the sub-specialty is dropped. (The catalogue changes by migration, and the foreign keys
 * only null out deleted rows, not moved ones.)
 */
export function resolveSelection(catalogue: Catalogue, ids: SelectionIds): ResolvedSelection {
	const specialty = catalogue.find(({ id }) => id === ids.specialtyId) ?? null;
	if (!specialty) return { specialty: null, subSpecialty: null, illustration: null };

	const subSpecialty =
		specialty.subSpecialties.find(({ id }) => id === ids.subSpecialtyId) ??
		specialty.subSpecialties[0] ??
		null;
	const illustration =
		subSpecialty?.illustrations.find(({ id }) => id === ids.illustrationId) ?? null;

	return { specialty, subSpecialty, illustration };
}

export function selectionIds({
	specialty,
	subSpecialty,
	illustration
}: ResolvedSelection): SelectionIds {
	return {
		specialtyId: specialty?.id ?? null,
		subSpecialtyId: subSpecialty?.id ?? null,
		illustrationId: illustration?.id ?? null
	};
}

/**
 * Strict check for the `chooseIllustration` action: the illustration must be in the
 * sub-specialty, and the sub-specialty in the specialty. Null when the path isn't in the catalogue.
 */
export function findIllustrationPath(
	catalogue: Catalogue,
	ids: { specialtyId: string; subSpecialtyId: string; illustrationId: string }
): ResolvedSelection | null {
	const specialty = catalogue.find(({ id }) => id === ids.specialtyId);
	const subSpecialty = specialty?.subSpecialties.find(({ id }) => id === ids.subSpecialtyId);
	const illustration = subSpecialty?.illustrations.find(({ id }) => id === ids.illustrationId);
	if (!specialty || !subSpecialty || !illustration) return null;
	return { specialty, subSpecialty, illustration };
}
