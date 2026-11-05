import type { Catalogue } from '../../catalogue/types';
import { adminClient } from '../supabase';

/**
 * The illustration catalogue, read-only (data-model §3.3): specialties → sub-specialties →
 * illustrations. Every user sees all of it (no tenant filter). The catalogue changes only through
 * SQL migrations, so nothing here writes.
 *
 * Not cached (2.3, user decision 2026-11-05): /annotate's response also carries the user's own
 * state, and the hooks may already have set `Cache-Control: no-store` for a refreshed session.
 */

const SELECT = `
	id, name,
	specialty_sub_specialties (
		ordering,
		sub_specialties (
			id, name,
			sub_specialty_illustrations (
				ordering,
				illustrations ( id, name, src, default_illustration, illustration_aliases )
			)
		)
	)
` as const;

/** One `specialties` row with its embedded children, as PostgREST returns it. */
export interface CatalogueRow {
	id: string;
	name: string;
	specialty_sub_specialties: {
		ordering: number;
		sub_specialties: {
			id: string;
			name: string;
			sub_specialty_illustrations: {
				ordering: number;
				illustrations: {
					id: string;
					name: string;
					src: string;
					default_illustration: boolean;
					illustration_aliases: string[] | null;
				};
			}[];
		};
	}[];
}

// Names compare as people read them: case and accents ignored, "Level 2" before "Level 10".
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function byName(a: { id: string; name: string }, b: { id: string; name: string }) {
	return collator.compare(a.name, b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function byOrderingThenName<T extends { ordering: number; item: { id: string; name: string } }>(
	a: T,
	b: T
) {
	return a.ordering - b.ordering || byName(a.item, b.item);
}

/** Shapes and orders the rows: specialties by name; children by `ordering`, then name. */
export function toCatalogue(rows: readonly CatalogueRow[]): Catalogue {
	return [...rows].sort(byName).map((specialty) => ({
		id: specialty.id,
		name: specialty.name,
		subSpecialties: specialty.specialty_sub_specialties
			.map(({ ordering, sub_specialties }) => ({ ordering, item: sub_specialties }))
			.sort(byOrderingThenName)
			.map(({ item: subSpecialty }) => ({
				id: subSpecialty.id,
				name: subSpecialty.name,
				illustrations: subSpecialty.sub_specialty_illustrations
					.map(({ ordering, illustrations }) => ({ ordering, item: illustrations }))
					.sort(byOrderingThenName)
					.map(({ item: illustration }) => ({
						id: illustration.id,
						name: illustration.name,
						src: illustration.src,
						alias: illustration.illustration_aliases ?? [],
						defaultIllustration: illustration.default_illustration
					}))
			}))
	}));
}

/** Reads the whole catalogue. Throws if the query fails or the catalogue is empty. */
export async function loadCatalogue(): Promise<Catalogue> {
	const { data, error } = await adminClient().from('specialties').select(SELECT);
	if (error) throw new Error('catalogue lookup failed', { cause: error });
	// An empty catalogue means a broken deploy or seed, not something a user can fix.
	if (data.length === 0) throw new Error('catalogue is empty');
	return toCatalogue(data satisfies CatalogueRow[]);
}
