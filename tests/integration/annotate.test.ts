import { isActionFailure } from '@sveltejs/kit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { actions, load } from '../../src/routes/(app)/annotate/+page.server';
import { loadCatalogue } from '../../src/lib/server/repos/catalogue';
import type { Catalogue } from '../../src/lib/catalogue/types';
import { NO_SELECTION, type SelectionIds } from '../../src/lib/catalogue/selection';
import { flowHelpers } from './flow-helpers';
import { adminClient, ensureAccount, sqlClient } from './helpers';
import { requestHelpers, type Jar } from './request-helpers';

// /annotate's load and actions (2.4) behind the real hook: the caller's own selection, saved by id,
// checked against the catalogue, never anyone else's row.

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { signedInJar, addPolicy } = requestHelpers(admin, sql, created);
const { call } = flowHelpers(admin, sql, created, 'annotate');

let catalogue: Catalogue;
beforeAll(async () => {
	catalogue = await loadCatalogue();
});
afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {});
	await sql.end();
});

type Me = { jar: Jar; userId: string; email: string };

async function me(): Promise<Me> {
	const signedIn = await signedInJar();
	const user = await ensureAccount(admin, signedIn.authId);
	await addPolicy(user.id, signedIn.sessionId, 'personal', '1 hour', '1 minute');
	const { data } = await admin.auth.admin.getUserById(signedIn.authId);
	return { jar: signedIn.jar, userId: user.id, email: data.user!.email! };
}

async function stored(userId: string): Promise<SelectionIds> {
	const [row] = await sql<
		{
			specialty_id: string | null;
			sub_specialty_id: string | null;
			illustration_id: string | null;
		}[]
	>`select selected_specialty_id as specialty_id, selected_sub_specialty_id as sub_specialty_id,
	         selected_illustration_id as illustration_id
	  from public.user_app_states where user_id = ${userId}`;
	return {
		specialtyId: row.specialty_id,
		subSpecialtyId: row.sub_specialty_id,
		illustrationId: row.illustration_id
	};
}

async function store(userId: string, ids: SelectionIds) {
	await sql`update public.user_app_states set
		selected_specialty_id = ${ids.specialtyId},
		selected_sub_specialty_id = ${ids.subSpecialtyId},
		selected_illustration_id = ${ids.illustrationId}
	  where user_id = ${userId}`;
}

/** A specialty with at least two sub-specialties, the second having illustrations. */
function pick() {
	const specialty = catalogue.find(({ subSpecialties }) => subSpecialties.length >= 2);
	const other = catalogue.find(({ id }) => id !== specialty?.id);
	if (!specialty || !other) throw new Error('the seed needs two specialties, one with two subs');
	const sub = specialty.subSpecialties[1];
	return { specialty, sub, illustration: sub.illustrations[0], other };
}

async function loadAs(user: Me) {
	const outcome = await call(user.jar, '/annotate', load as never);
	expect(outcome.thrown).toBeUndefined();
	return outcome.result as {
		catalogue: Catalogue;
		selection: SelectionIds;
		accountInitial: string;
	};
}

function failureStatus(result: unknown) {
	return isActionFailure(result) ? result.status : undefined;
}

describe('load', () => {
	it('gives a new account the catalogue, no selection and the email initial', async () => {
		const user = await me();
		const data = await loadAs(user);

		expect(data.catalogue).toEqual(catalogue);
		expect(data.selection).toEqual(NO_SELECTION);
		expect(data.accountInitial).toBe(user.email[0].toUpperCase());
		// Nothing else about the account reaches the page.
		expect(Object.keys(data).sort()).toEqual(['accountInitial', 'catalogue', 'selection']);
	});

	it('normalises a stored selection that no longer fits the catalogue', async () => {
		const user = await me();
		const { specialty, other } = pick();
		// A sub-specialty and illustration from another specialty.
		await store(user.userId, {
			specialtyId: specialty.id,
			subSpecialtyId: other.subSpecialties[0].id,
			illustrationId: other.subSpecialties[0].illustrations[0].id
		});

		expect((await loadAs(user)).selection).toEqual({
			specialtyId: specialty.id,
			subSpecialtyId: specialty.subSpecialties[0].id,
			illustrationId: null
		});
	});
});

describe('?/chooseSpecialty', () => {
	it('saves the specialty with its first sub-specialty and no illustration', async () => {
		const user = await me();
		const { specialty } = pick();

		const { result, thrown } = await call(
			user.jar,
			'/annotate?/chooseSpecialty',
			actions.chooseSpecialty as never,
			{
				specialtyId: specialty.id
			}
		);

		const expected = {
			specialtyId: specialty.id,
			subSpecialtyId: specialty.subSpecialties[0].id,
			illustrationId: null
		};
		expect(thrown).toBeUndefined();
		expect(result).toEqual({ selection: expected });
		expect(await stored(user.userId)).toEqual(expected);
		expect((await loadAs(user)).selection).toEqual(expected);
	});

	it.each([
		['an id not in the catalogue', () => crypto.randomUUID()],
		['a value that is not a uuid', () => 'cardiology'],
		['nothing', () => '']
	])('refuses %s and changes nothing', async (_label, value) => {
		const user = await me();

		const { result } = await call(
			user.jar,
			'/annotate?/chooseSpecialty',
			actions.chooseSpecialty as never,
			{
				specialtyId: value()
			}
		);

		expect(failureStatus(result)).toBe(400);
		expect(await stored(user.userId)).toEqual(NO_SELECTION);
	});
});

describe('?/chooseIllustration', () => {
	it('saves the illustration with where it was found', async () => {
		const user = await me();
		const { specialty, sub, illustration } = pick();
		const ids = {
			specialtyId: specialty.id,
			subSpecialtyId: sub.id,
			illustrationId: illustration.id
		};

		const { result, thrown } = await call(
			user.jar,
			'/annotate?/chooseIllustration',
			actions.chooseIllustration as never,
			ids
		);

		expect(thrown).toBeUndefined();
		expect(result).toEqual({ selection: ids });
		expect(await stored(user.userId)).toEqual(ids);
		expect((await loadAs(user)).selection).toEqual(ids);
	});

	it('refuses an illustration outside the given sub-specialty or specialty', async () => {
		const user = await me();
		const { specialty, sub, other } = pick();
		const foreign = other.subSpecialties[0];
		const attempts = [
			{
				specialtyId: specialty.id,
				subSpecialtyId: foreign.id,
				illustrationId: foreign.illustrations[0].id
			},
			{
				specialtyId: other.id,
				subSpecialtyId: foreign.id,
				illustrationId: sub.illustrations.find(
					({ id }) => !foreign.illustrations.some((own) => own.id === id)
				)!.id
			},
			{ specialtyId: specialty.id, subSpecialtyId: sub.id, illustrationId: crypto.randomUUID() }
		];

		for (const fields of attempts) {
			const { result } = await call(
				user.jar,
				'/annotate?/chooseIllustration',
				actions.chooseIllustration as never,
				fields
			);
			expect(failureStatus(result)).toBe(400);
		}
		expect(await stored(user.userId)).toEqual(NO_SELECTION);
	});
});

describe("someone else's row", () => {
	it('is never written, even with a user id in the form', async () => {
		const user = await me();
		const bystander = await me();
		const { specialty, sub, illustration, other } = pick();
		const before = {
			specialtyId: other.id,
			subSpecialtyId: other.subSpecialties[0].id,
			illustrationId: null
		};
		await store(bystander.userId, before);

		await call(user.jar, '/annotate?/chooseIllustration', actions.chooseIllustration as never, {
			specialtyId: specialty.id,
			subSpecialtyId: sub.id,
			illustrationId: illustration.id,
			userId: bystander.userId,
			user_id: bystander.userId
		});

		expect(await stored(bystander.userId)).toEqual(before);
		expect((await stored(user.userId)).illustrationId).toBe(illustration.id);
	});
});
