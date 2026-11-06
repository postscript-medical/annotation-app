import { isRedirect, type RequestEvent } from '@sveltejs/kit';
import { afterAll, describe, expect, it } from 'vitest';
import { load } from '../../src/routes/(app)/+layout.server';
import { adminClient, ensureAccount, sqlClient } from './helpers';
import { Jar, requestHelpers } from './request-helpers';

// The (app) guard behind the real hook, with real sessions (auth-spec §7.2): what a request to an
// (app) page gets in each state.
const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { fakeEvent, signedInJar, addPolicy, run } = requestHelpers(admin, sql, created);

afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id);
	await sql.end();
});

/** Stands in for SvelteKit rendering an (app) page: runs the layout load. */
async function renderAppPage(event: RequestEvent) {
	const data = await load(event as never);
	return new Response(JSON.stringify(data));
}

function location(thrown: unknown) {
	expect(isRedirect(thrown)).toBe(true);
	return isRedirect(thrown) ? `${thrown.status} ${thrown.location}` : '';
}

describe('(app) pages', () => {
	it('signed out → 303 to the sign-in form with next', async () => {
		const { thrown } = await run(fakeEvent(new Jar(), '/annotate'), undefined, renderAppPage);
		expect(location(thrown)).toBe('303 /?next=%2Fannotate');
	});

	it('signed in with a valid policy → the page renders, with no user data in it', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 hour', '1 minute');

		const { response, thrown } = await run(fakeEvent(jar, '/annotate'), undefined, renderAppPage);
		expect(thrown).toBeUndefined();
		expect(await response?.text()).toBe('{}');
	});

	it('a session revoked elsewhere (policy row gone) → signed out, then 303 to the sign-in form', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 hour', '1 minute');
		await sql`delete from public.session_policies where session_id = ${sessionId}`;

		const { thrown } = await run(fakeEvent(jar, '/annotate'), undefined, renderAppPage);
		expect(location(thrown)).toBe('303 /?next=%2Fannotate');
		expect(jar.authCookies()).toEqual([]);
	});

	it('an expired session → the hook redirects to /?expired=1 before the page runs', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'shared', '9 hours', '1 minute');

		const { thrown, resolve } = await run(fakeEvent(jar, '/annotate'), undefined, renderAppPage);
		expect(location(thrown)).toBe('303 /?expired=1');
		expect(resolve).not.toHaveBeenCalled();
	});
});
