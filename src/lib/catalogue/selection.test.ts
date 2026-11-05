import { describe, expect, it } from 'vitest';
import { findIllustrationPath, NO_SELECTION, resolveSelection, selectionIds } from './selection';
import type { Catalogue, Illustration } from './types';

function illustration(id: string): Illustration {
	return { id, name: id, src: `${id}.jpg`, alias: [], defaultIllustration: false };
}

const heart = illustration('heart');
const valve = illustration('valve');
const kidney = illustration('kidney');

const catalogue: Catalogue = [
	{
		id: 'cardio',
		name: 'Cardiology',
		subSpecialties: [
			{ id: 'adult', name: 'Adult', illustrations: [heart, valve] },
			{ id: 'paeds', name: 'Paediatric', illustrations: [heart] }
		]
	},
	{
		id: 'renal',
		name: 'Nephrology',
		subSpecialties: [{ id: 'kidney-sub', name: 'Kidney', illustrations: [kidney] }]
	},
	{ id: 'empty', name: 'Empty', subSpecialties: [] }
];

describe('resolveSelection (stored state, lenient)', () => {
	it('resolves a consistent selection', () => {
		const ids = { specialtyId: 'cardio', subSpecialtyId: 'paeds', illustrationId: 'heart' };
		const resolved = resolveSelection(catalogue, ids);

		expect(resolved.specialty?.id).toBe('cardio');
		expect(resolved.subSpecialty?.id).toBe('paeds');
		expect(resolved.illustration).toBe(heart);
		expect(selectionIds(resolved)).toEqual(ids);
	});

	it('clears everything for no or an unknown specialty', () => {
		expect(selectionIds(resolveSelection(catalogue, NO_SELECTION))).toEqual(NO_SELECTION);
		expect(
			selectionIds(
				resolveSelection(catalogue, {
					specialtyId: 'gone',
					subSpecialtyId: 'adult',
					illustrationId: 'heart'
				})
			)
		).toEqual(NO_SELECTION);
	});

	it("falls back to the specialty's first sub-specialty and drops an illustration not in it", () => {
		const resolved = resolveSelection(catalogue, {
			specialtyId: 'cardio',
			subSpecialtyId: 'kidney-sub',
			illustrationId: 'kidney'
		});

		expect(selectionIds(resolved)).toEqual({
			specialtyId: 'cardio',
			subSpecialtyId: 'adult',
			illustrationId: null
		});
	});

	it('keeps a specialty that has no sub-specialties', () => {
		expect(
			selectionIds(resolveSelection(catalogue, { ...NO_SELECTION, specialtyId: 'empty' }))
		).toEqual({ ...NO_SELECTION, specialtyId: 'empty' });
	});
});

describe('findIllustrationPath (action input, strict)', () => {
	it('accepts an illustration in the sub-specialty, in the specialty', () => {
		const path = findIllustrationPath(catalogue, {
			specialtyId: 'cardio',
			subSpecialtyId: 'adult',
			illustrationId: 'valve'
		});

		expect(path && selectionIds(path)).toEqual({
			specialtyId: 'cardio',
			subSpecialtyId: 'adult',
			illustrationId: 'valve'
		});
	});

	it.each([
		[
			'an unknown specialty',
			{ specialtyId: 'gone', subSpecialtyId: 'adult', illustrationId: 'heart' }
		],
		[
			'a sub-specialty of another specialty',
			{ specialtyId: 'renal', subSpecialtyId: 'adult', illustrationId: 'heart' }
		],
		[
			'an illustration of another sub-specialty',
			{ specialtyId: 'cardio', subSpecialtyId: 'paeds', illustrationId: 'valve' }
		],
		[
			'an unknown illustration',
			{ specialtyId: 'cardio', subSpecialtyId: 'adult', illustrationId: 'gone' }
		]
	])('rejects %s', (_label, ids) => {
		expect(findIllustrationPath(catalogue, ids)).toBeNull();
	});
});
