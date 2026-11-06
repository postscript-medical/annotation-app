import type { Catalogue, Illustration } from '#lib/catalogue/types.ts';

// Made-up data for stories. Stories never hold real patient or account details; the images are
// placeholders in .storybook/public, because the app's /images proxy doesn't exist in Storybook.

function illustration(id: string, name: string, src: string): Illustration {
	return { id, name, src, alias: [], defaultIllustration: false };
}

export const illustrations: Illustration[] = [
	illustration('i1', 'Sample illustration one', 'sample-a.svg'),
	illustration('i2', 'Sample illustration two', 'sample-b.svg'),
	illustration('i3', 'Sample illustration three', 'sample-c.svg'),
	illustration('i4', 'A much longer sample illustration name, to show wrapping', 'sample-a.svg'),
	illustration('i5', 'Sample illustration five', 'sample-b.svg'),
	illustration('i6', 'Sample illustration six', 'sample-c.svg')
];

export const catalogue: Catalogue = [
	{
		id: 's1',
		name: 'Specialty one',
		subSpecialties: [
			{ id: 'ss1', name: 'Sub-specialty A', illustrations },
			{ id: 'ss2', name: 'Sub-specialty B', illustrations: illustrations.slice(0, 2) }
		]
	},
	{
		id: 's2',
		name: 'Specialty two',
		subSpecialties: [{ id: 'ss3', name: 'Sub-specialty C', illustrations: illustrations.slice(2) }]
	},
	{ id: 's3', name: 'Specialty three', subSpecialties: [] }
];
