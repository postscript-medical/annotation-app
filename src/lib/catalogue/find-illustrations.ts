import type { Illustration, SubSpecialty } from './types';

/**
 * The illustrations of one sub-specialty, or none if it isn't in the list. Ported from legacy
 * `methods/find-illustrations.js`, which matched by name; this matches by id, because /annotate
 * works with ids from 2.4 on.
 */
export function findIllustrations(
	subSpecialties: readonly SubSpecialty[],
	subSpecialtyId: string | null | undefined
): Illustration[] {
	if (!subSpecialtyId) return [];
	return subSpecialties.find(({ id }) => id === subSpecialtyId)?.illustrations ?? [];
}
