import { isHttpError } from '@sveltejs/kit';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	actions as accountActions,
	load as accountLoad
} from '../../src/routes/(app)/account/+page.server';
import { POST as exportPost } from '../../src/routes/(app)/account/export/+server';
import { actions as passwordActions } from '../../src/routes/(app)/account/password/+page.server';
import { SESSION_MODE_COOKIE } from '../../src/lib/server/supabase';
import { BREACHED, failure, flowHelpers, redirectTo, stubHibp } from './flow-helpers';
import { adminClient, ensureAccount, publishableClient, sqlClient, testPassword } from './helpers';
import { requestHelpers, type Jar } from './request-helpers';

// The account page (auth-spec §4.3) behind the real hook: sessions, sign out one or all, download
// my data, change password, delete the account. Accounts are made with the Admin API and signed
// in with their password (testPassword).

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { signedInJar, signInAgain, addPolicy, authSessionExists } = requestHelpers(
	admin,
	sql,
	created
);
const { call } = flowHelpers(admin, sql, created, 'acct');
const NEW_PASSWORD = 'copper meadow sparrow tuesday';

beforeAll(stubHibp);
afterAll(async () => {
	vi.unstubAllGlobals();
	for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {});
	await sql.end();
});

/** An account with one valid session; `more` extra sessions as from other devices. */
async function account(more = 0) {
	const first = await signedInJar();
	const user = await ensureAccount(admin, first.authId);
	await addPolicy(user.id, first.sessionId, 'personal', '1 hour', '1 minute');
	const others: { jar: Jar; sessionId: string }[] = [];
	for (let i = 0; i < more; i++) {
		const again = await signInAgain(first.email);
		await addPolicy(user.id, again.sessionId, 'shared', '10 minutes', '1 minute');
		others.push(again);
	}
	return { ...first, userId: user.id, others };
}

async function policyIds(userId: string) {
	const rows = await sql`select session_id from public.session_policies where user_id = ${userId}`;
	return rows.map((r) => r.session_id as string).sort();
}

describe('/account', () => {
	it('shows the email and only this account’s sessions, marking this one', async () => {
		const me = await account(1);
		await account(1); // someone else, with sessions of their own

		const { result } = await call(me.jar, '/account', accountLoad as never);
		const data = result as {
			email: string;
			sessions: { id: string; mode: string; current: boolean }[];
		};
		expect(data.email).toBe(me.email);
		expect(data.sessions.map((s) => s.id).sort()).toEqual(
			[me.sessionId, me.others[0].sessionId].sort()
		);
		expect(data.sessions.find((s) => s.current)?.id).toBe(me.sessionId);
		// Exactly these fields reach the page: no IP, device or token details (auth-spec §4.3).
		expect(Object.keys(data).sort()).toEqual(['email', 'passwordChanged', 'sessions']);
		for (const s of data.sessions) {
			expect(Object.keys(s).sort()).toEqual(['createdAt', 'current', 'id', 'lastSeenAt', 'mode']);
		}
	});
});

describe('sign out one session', () => {
	it('ends another of my sessions: policy row and Supabase session', async () => {
		const me = await account(1);
		const other = me.others[0].sessionId;
		const outcome = await call(me.jar, '/account?/signOutSession', accountActions.signOutSession, {
			sessionId: other
		});
		expect(outcome.result).toEqual({ revoked: true });
		expect(await policyIds(me.userId)).toEqual([me.sessionId]);
		expect(await authSessionExists(other)).toBe(false);
		expect(await authSessionExists(me.sessionId)).toBe(true);
	});

	it("someone else's session id → 404, and their session is untouched", async () => {
		const me = await account();
		const them = await account();
		const outcome = await call(me.jar, '/account?/signOutSession', accountActions.signOutSession, {
			sessionId: them.sessionId
		});
		expect(isHttpError(outcome.thrown, 404)).toBe(true);
		expect(await policyIds(them.userId)).toEqual([them.sessionId]);
		expect(await authSessionExists(them.sessionId)).toBe(true);
	});

	it('a malformed or unknown id → 404', async () => {
		const me = await account();
		for (const sessionId of ['not-a-uuid', crypto.randomUUID()]) {
			const outcome = await call(
				me.jar,
				'/account?/signOutSession',
				accountActions.signOutSession,
				{
					sessionId
				}
			);
			expect(isHttpError(outcome.thrown, 404)).toBe(true);
		}
	});

	it('this session → signed out here', async () => {
		const me = await account();
		const outcome = await call(me.jar, '/account?/signOutSession', accountActions.signOutSession, {
			sessionId: me.sessionId
		});
		expect(redirectTo(outcome)).toBe('/');
		expect(me.jar.authCookies()).toEqual([]);
		expect(await policyIds(me.userId)).toEqual([]);
	});
});

describe('sign out of all devices', () => {
	it('ends every session, this one included', async () => {
		const me = await account(2);
		const outcome = await call(
			me.jar,
			'/account?/signOutEverywhere',
			accountActions.signOutEverywhere,
			{}
		);
		expect(redirectTo(outcome)).toBe('/');
		expect(await policyIds(me.userId)).toEqual([]);
		for (const id of [me.sessionId, ...me.others.map((o) => o.sessionId)]) {
			expect(await authSessionExists(id)).toBe(false);
		}
		expect(me.jar.authCookies()).toEqual([]);
		expect(me.jar.get(SESSION_MODE_COOKIE)).toBeUndefined();
	});
});

describe('download my data', () => {
	it('returns a JSON attachment of this account, never cached, with no secrets', async () => {
		const me = await account();
		const outcome = await call(me.jar, '/account/export', exportPost, {});
		expect(outcome.thrown).toBeUndefined();
		const response = outcome.result as Response;
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(response.headers.get('content-disposition')).toMatch(
			/^attachment; filename="postscript-account-\d{4}-\d{2}-\d{2}\.json"$/
		);
		expect(response.headers.get('cache-control')).toBe('no-store');
		const text = await response.text();
		const body = JSON.parse(text);
		expect(body.login.email).toBe(me.email);
		expect(body.account.id).toBe(me.userId);
		expect(body.sessions).toHaveLength(1);
		expect(text).not.toMatch(/encrypted_password|\$2[aby]\$|token|session_id/i);
	});
});

describe('change password', () => {
	async function change(jar: Jar, currentPassword: string, newPassword: string) {
		return call(jar, '/account/password', passwordActions.default, {
			currentPassword,
			newPassword
		});
	}

	it('needs the current password', async () => {
		const me = await account();
		const outcome = await change(me.jar, 'not my current password', NEW_PASSWORD);
		expect(failure(outcome).data.fieldErrors).toMatchObject({
			currentPassword: expect.stringContaining('current password')
		});
	});

	it('puts the new password through the policy', async () => {
		const me = await account();
		expect(
			failure(await change(me.jar, testPassword, 'too short')).data.fieldErrors
		).toHaveProperty('newPassword');
		expect(failure(await change(me.jar, testPassword, BREACHED)).data.fieldErrors).toMatchObject({
			newPassword: expect.stringContaining('data breach')
		});
		expect(
			failure(await change(me.jar, testPassword, testPassword)).data.fieldErrors
		).toMatchObject({ newPassword: expect.stringContaining('different') });
	});

	it('changes it, signs out the other devices and keeps this one', async () => {
		const me = await account(1);
		const outcome = await change(me.jar, testPassword, NEW_PASSWORD);
		expect(redirectTo(outcome)).toBe('/account?password-changed=1');
		expect(await policyIds(me.userId)).toEqual([me.sessionId]);
		expect(await authSessionExists(me.others[0].sessionId)).toBe(false);

		// The check of the current password left no session behind.
		const [{ count }] =
			await sql`select count(*)::int from auth.sessions where user_id = ${me.authId}`;
		expect(count).toBe(1);

		const client = publishableClient();
		expect(
			(await client.auth.signInWithPassword({ email: me.email, password: testPassword })).error
				?.code
		).toBe('invalid_credentials');
		expect(
			(await client.auth.signInWithPassword({ email: me.email, password: NEW_PASSWORD })).error
		).toBeNull();
	});

	it('stops checking the current password after 5 wrong tries', async () => {
		const me = await account();
		for (let i = 0; i < 5; i++)
			failure(await change(me.jar, `wrong password number ${i}!`, NEW_PASSWORD));
		const outcome = await change(me.jar, testPassword, NEW_PASSWORD);
		expect(failure(outcome).data.fieldErrors).toHaveProperty('currentPassword');
	});
});

describe('delete my account', () => {
	async function remove(jar: Jar, password: string, confirmEmail: string) {
		return call(jar, '/account?/delete', accountActions.delete, { password, confirmEmail });
	}

	it('needs the email address typed', async () => {
		const me = await account();
		const outcome = await remove(me.jar, testPassword, `someone-else-${me.email}`);
		expect(failure(outcome).data.deleteErrors).toHaveProperty('confirmEmail');
		expect(await policyIds(me.userId)).toEqual([me.sessionId]);
	});

	it('needs the current password', async () => {
		const me = await account();
		const outcome = await remove(me.jar, 'not my current password', me.email);
		expect(failure(outcome).data.deleteErrors).toHaveProperty('password');
		const [{ count }] = await sql`select count(*)::int from auth.users where id = ${me.authId}`;
		expect(count).toBe(1);
	});

	it('deletes the account and everything about it, and signs out', async () => {
		const me = await account(1);
		const outcome = await remove(me.jar, testPassword, me.email.toUpperCase());
		expect(redirectTo(outcome)).toBe('/?deleted=1');
		expect(me.jar.authCookies()).toEqual([]);

		const [row] = await sql`
			select
				(select count(*) from auth.users where id = ${me.authId})::int as auth_users,
				(select count(*) from auth.sessions where user_id = ${me.authId})::int as auth_sessions,
				(select count(*) from public.users where id = ${me.userId})::int as users,
				(select count(*) from public.workspaces where personal_owner_id = ${me.userId})::int as workspaces,
				(select count(*) from public.workspace_members where user_id = ${me.userId})::int as memberships,
				(select count(*) from public.user_app_states where user_id = ${me.userId})::int as app_states,
				(select count(*) from public.session_policies where user_id = ${me.userId})::int as policies
		`;
		expect(row).toEqual({
			auth_users: 0,
			auth_sessions: 0,
			users: 0,
			workspaces: 0,
			memberships: 0,
			app_states: 0,
			policies: 0
		});

		// The other device is signed out on its next request.
		const next = await call(me.others[0].jar, '/annotate', () => null);
		expect(next.event.locals.session).toBeNull();
	});
});
