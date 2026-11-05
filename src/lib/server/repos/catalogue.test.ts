import { describe, expect, it } from 'vitest';
import { toCatalogue, type CatalogueRow } from './catalogue';

type IllustrationRow =
	CatalogueRow['specialty_sub_specialties'][number]['sub_specialties']['sub_specialty_illustrations'][number];

function illustration(
	id: string,
	name: string,
	ordering = 0,
	aliases: string[] | null = [],
	isDefault = false
) {
	return {
		ordering,
		illustrations: {
			id,
			name,
			src: `cloudinary/${id}`,
			default_illustration: isDefault,
			illustration_aliases: aliases
		}
	} satisfies IllustrationRow;
}

function subSpecialty(id: string, name: string, ordering: number, items: IllustrationRow[] = []) {
	return {
		ordering,
		sub_specialties: { id, name, sub_specialty_illustrations: items }
	};
}

function specialty(
	id: string,
	name: string,
	subs: CatalogueRow['specialty_sub_specialties'] = []
): CatalogueRow {
	return { id, name, specialty_sub_specialties: subs };
}

describe('toCatalogue', () => {
	it('maps rows to the shape /annotate uses', () => {
		const rows = [
			specialty('s1', 'Urology', [
				subSpecialty('ss1', 'Kidney', 0, [illustration('i1', 'Nephron', 0, ['renal unit'], true)])
			])
		];

		expect(toCatalogue(rows)).toEqual([
			{
				id: 's1',
				name: 'Urology',
				subSpecialties: [
					{
						id: 'ss1',
						name: 'Kidney',
						illustrations: [
							{
								id: 'i1',
								name: 'Nephron',
								src: 'cloudinary/i1',
								alias: ['renal unit'],
								defaultIllustration: true
							}
						]
					}
				]
			}
		]);
	});

	it('treats missing aliases as none', () => {
		const rows = [
			specialty('s1', 'A', [subSpecialty('ss1', 'B', 0, [illustration('i1', 'C', 0, null)])])
		];

		expect(toCatalogue(rows)[0].subSpecialties[0].illustrations[0].alias).toEqual([]);
	});

	it('orders specialties by name, ignoring case and accents, numbers by value', () => {
		const rows = [
			specialty('a', 'urology'),
			specialty('b', 'Émergency'),
			specialty('c', 'Cardiology'),
			specialty('d', 'Level 10'),
			specialty('e', 'Level 2')
		];

		expect(toCatalogue(rows).map(({ name }) => name)).toEqual([
			'Cardiology',
			'Émergency',
			'Level 2',
			'Level 10',
			'urology'
		]);
	});

	it('orders sub-specialties and illustrations by ordering, then name', () => {
		const rows = [
			specialty('s1', 'S', [
				subSpecialty('z', 'Zeta', 0),
				subSpecialty('a', 'Alpha', 1),
				subSpecialty('m', 'Mu', 0, [
					illustration('i3', 'Cc', 0),
					illustration('i1', 'Aa', 2),
					illustration('i2', 'Bb', 0)
				])
			])
		];
		const [{ subSpecialties }] = toCatalogue(rows);

		expect(subSpecialties.map(({ name }) => name)).toEqual(['Mu', 'Zeta', 'Alpha']);
		expect(subSpecialties[0].illustrations.map(({ name }) => name)).toEqual(['Bb', 'Cc', 'Aa']);
	});

	it('breaks name ties by id, so the order is stable', () => {
		const rows = [specialty('b', 'Same'), specialty('a', 'same')];

		expect(toCatalogue(rows).map(({ id }) => id)).toEqual(['a', 'b']);
	});

	it('does not change its input', () => {
		const rows = [specialty('b', 'B'), specialty('a', 'A')];
		const copy = structuredClone(rows);

		toCatalogue(rows);
		expect(rows).toEqual(copy);
	});
});
