import { describe, expect, it } from 'vitest';
import { filterIllustrations } from './filter-illustrations';
import { findIllustrations } from './find-illustrations';
import type { Illustration, SubSpecialty } from './types';

function illustration(name: string, alias: string[] = []): Illustration {
	return { id: name, name, src: `cloudinary/${name}`, alias, defaultIllustration: false };
}

const heart = illustration('Heart – anterior view', ['cardiac', 'Myocardium']);
const kidney = illustration('Kidney', ['renal']);
const knee = illustration('Knee joint');
const all = [kidney, heart, knee];

describe('filterIllustrations', () => {
	it.each([undefined, null, '', '   '])('returns everything for the query %j', (query) => {
		expect(filterIllustrations(all, query)).toEqual(all);
	});

	it('returns a copy, not the same array', () => {
		expect(filterIllustrations(all, '')).not.toBe(all);
	});

	it('matches part of the name, ignoring case', () => {
		expect(filterIllustrations(all, 'KN')).toEqual([knee]);
		expect(filterIllustrations(all, 'anterior')).toEqual([heart]);
	});

	it('matches an alias', () => {
		expect(filterIllustrations(all, 'myocard')).toEqual([heart]);
		expect(filterIllustrations(all, 'renal')).toEqual([kidney]);
	});

	it('ignores spaces around the query', () => {
		expect(filterIllustrations(all, '  kidney ')).toEqual([kidney]);
	});

	it('keeps the given order (the catalogue order)', () => {
		expect(filterIllustrations(all, 'k')).toEqual([kidney, knee]);
	});

	it('returns nothing when nothing matches', () => {
		expect(filterIllustrations(all, 'spleen')).toEqual([]);
	});
});

describe('findIllustrations', () => {
	const subSpecialties: SubSpecialty[] = [
		{ id: 'ss-cardio', name: 'Cardiology', illustrations: [heart] },
		{ id: 'ss-renal', name: 'Nephrology', illustrations: [kidney] }
	];

	it("returns the sub-specialty's illustrations by id", () => {
		expect(findIllustrations(subSpecialties, 'ss-renal')).toEqual([kidney]);
	});

	it('does not match by name', () => {
		expect(findIllustrations(subSpecialties, 'Nephrology')).toEqual([]);
	});

	it.each([undefined, null, '', 'unknown'])('returns nothing for %j', (id) => {
		expect(findIllustrations(subSpecialties, id)).toEqual([]);
	});
});
