import { afterAll, describe, expect, it } from 'vitest';
import { load as annotateLoad } from '../../src/routes/(app)/annotate/+page.server';
import { loadCatalogue } from '../../src/lib/server/repos/catalogue';
import type { Catalogue } from '../../src/lib/catalogue/types';
import { flowHelpers, redirectTo } from './flow-helpers';
import { adminClient, ensureAccount, sqlClient } from './helpers';
import { Jar, requestHelpers } from './request-helpers';

// The catalogue repo and /annotate's load (2.3) against the seeded local catalogue.

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { signedInJar, addPolicy } = requestHelpers(admin, sql, created);
const { call } = flowHelpers(admin, sql, created, 'cat');

afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {});
	await sql.end();
});

function counts(catalogue: Catalogue) {
	const subs = catalogue.flatMap(({ subSpecialties }) => subSpecialties);
	return {
		specialties: catalogue.length,
		specialtySubSpecialties: subs.length,
		subSpecialtyIllustrations: subs.flatMap(({ illustrations }) => illustrations).length
	};
}

describe('loadCatalogue', () => {
	it('returns every specialty, link and illustration in the database', async () => {
		const [row] = await sql<{ s: number; ssj: number; sij: number }[]>`
			select (select count(*) from public.specialties)::int as s,
			       (select count(*) from public.specialty_sub_specialties)::int as ssj,
			       (select count(*) from public.sub_specialty_illustrations)::int as sij`;

		expect(row.s).toBeGreaterThan(0);
		expect(counts(await loadCatalogue())).toEqual({
			specialties: row.s,
			specialtySubSpecialties: row.ssj,
			subSpecialtyIllustrations: row.sij
		});
	});

	it('orders illustrations by `ordering` before name', async () => {
		const catalogue = await loadCatalogue();
		const sub = catalogue
			.flatMap(({ subSpecialties }) => subSpecialties)
			.find(({ illustrations }) => illustrations.length >= 2);
		expect(sub).toBeDefined();
		const first = sub!.illustrations[0];

		// Push the first illustration to the end; restore afterwards (the catalogue is shared).
		await sql`update public.sub_specialty_illustrations set ordering = 1
			where sub_specialty_id = ${sub!.id} and illustration_id = ${first.id}`;
		try {
			const moved = (await loadCatalogue())
				.flatMap(({ subSpecialties }) => subSpecialties)
				.find(({ id }) => id === sub!.id)!;
			expect(moved.illustrations.at(-1)?.id).toBe(first.id);
			expect(moved.illustrations.slice(0, -1)).toEqual(sub!.illustrations.slice(1));
		} finally {
			await sql`update public.sub_specialty_illustrations set ordering = 0
				where sub_specialty_id = ${sub!.id} and illustration_id = ${first.id}`;
		}
	});
});

describe('/annotate load', () => {
	it('gives a signed-in user the catalogue', async () => {
		const me = await signedInJar();
		const user = await ensureAccount(admin, me.authId);
		await addPolicy(user.id, me.sessionId, 'personal', '1 hour', '1 minute');

		const { result, thrown } = await call(me.jar, '/annotate', annotateLoad as never);

		expect(thrown).toBeUndefined();
		expect((result as { catalogue: Catalogue }).catalogue).toEqual(await loadCatalogue());
	});

	it('sends a signed-out visitor to sign in, without reading the catalogue', async () => {
		const outcome = await call(new Jar(), '/annotate', annotateLoad as never);

		expect(outcome.result).toBeUndefined();
		expect(redirectTo(outcome)).toBe('/sign-in?next=%2Fannotate');
	});
});
