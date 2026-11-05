import { isRedirect, type RequestEvent } from '@sveltejs/kit';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { handleError } from '../../src/hooks.server';
import { adminClient, createAuthUser, ensureAccount, sqlClient } from './helpers';
import { Jar, requestHelpers } from './request-helpers';

// The real hooks.server.ts handle against the local stack (auth-spec §3.2, §5).
const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { fakeEvent, deps, signedInJar, addPolicy, authSessionExists, run } = requestHelpers(
	admin,
	sql,
	created
);

afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id);
	await sql.end();
});

describe('signed out', () => {
	it('passes through with no session and adds the security headers', async () => {
		const { event, response, resolve } = await run(fakeEvent(new Jar()));
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.session).toBeNull();
		expect(event.locals.profile).toBeNull();
		expect(event.locals.requestId).toMatch(/^[0-9a-f-]{36}$/);
		expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response?.headers.get('Strict-Transport-Security')).toContain('max-age');
	});

	it('refuses an oversized body before touching Supabase', async () => {
		const ssrClient = vi.fn();
		const body = 'x'.repeat(70 * 1024);
		const event = fakeEvent(new Jar(), '/sign-in', {
			method: 'POST',
			body,
			headers: { 'content-length': String(body.length) }
		});
		const { response, resolve } = await run(event, { ...deps(), ssrClient });
		expect(response?.status).toBe(413);
		expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
		expect(ssrClient).not.toHaveBeenCalled();
		expect(resolve).not.toHaveBeenCalled();
	});

	it('drops a garbage auth cookie', async () => {
		const jar = new Jar();
		jar.store.set('sb-127-auth-token', 'base64-bm90IGEgc2Vzc2lvbg');
		const { event, resolve } = await run(fakeEvent(jar));
		expect(event.locals.session).toBeNull();
		expect(resolve).toHaveBeenCalledOnce();
	});
});

describe('a valid session', () => {
	it('sets locals.session and locals.profile', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 hour', '1 minute');

		const { event, resolve } = await run(fakeEvent(jar));
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.session).toEqual({
			id: sessionId,
			authId,
			mode: 'personal',
			amr: ['password'],
			recoveryVerifiedAt: null
		});
		const [membership] = await sql`
			select workspace_id from public.workspace_members where user_id = ${user.id}
		`;
		expect(event.locals.profile).toEqual({
			userId: user.id,
			workspaceId: membership.workspace_id,
			workspaceRole: 'owner'
		});
		expect(jar.authCookies().length).toBeGreaterThan(0);
	});

	it('writes last_seen_at only when it is 5 minutes old or more', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'shared', '1 hour', '4 minutes');
		const lastSeen = async () =>
			(
				await sql`select last_seen_at from public.session_policies where session_id = ${sessionId}`
			)[0].last_seen_at as Date;

		const before = await lastSeen();
		await run(fakeEvent(jar));
		expect(await lastSeen()).toEqual(before);

		await sql`
			update public.session_policies set last_seen_at = now() - interval '6 minutes'
			where session_id = ${sessionId}
		`;
		const now = new Date();
		await run(
			fakeEvent(jar),
			deps(() => now)
		);
		expect((await lastSeen()).getTime()).toBe(now.getTime());
	});

	it('creates a missing membership with ensure_account', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 hour', '1 minute');
		await sql`delete from public.workspaces where personal_owner_id = ${user.id}`;

		const { event } = await run(fakeEvent(jar));
		expect(event.locals.profile).toMatchObject({ userId: user.id, workspaceRole: 'owner' });
		const [{ count }] = await sql`
			select count(*)::int from public.workspace_members where user_id = ${user.id}
		`;
		expect(count).toBe(1);
	});
});

describe('public images (G7, 2.4)', () => {
	it('skips authentication for /images/: no session lookup, no cookie changes', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 hour', '1 minute');
		const cookiesBefore = jar.authCookies();
		const lookups = vi.fn(admin.from.bind(admin));
		const spyAdmin = Object.assign(Object.create(admin), { from: lookups });

		const { event, response, resolve } = await run(
			fakeEvent(jar, '/images/annotation-app/illustrations/vagus_nerve.jpg'),
			{ ...deps(), admin: () => spyAdmin }
		);

		expect(resolve).toHaveBeenCalledOnce();
		expect(lookups).not.toHaveBeenCalled();
		expect(event.locals.session).toBeNull();
		expect(event.locals.profile).toBeNull();
		expect(jar.authCookies()).toEqual(cookiesBefore);
		// Still gets the security headers.
		expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
	});

	it('still authenticates a path that only starts like it', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 hour', '1 minute');

		const { event } = await run(fakeEvent(jar, '/imagesx'));

		expect(event.locals.session?.id).toBe(sessionId);
	});
});

describe('sessions that must end', () => {
	it('signs out a session with no policy row and revokes it', async () => {
		const { jar, sessionId } = await signedInJar();
		const { event, resolve } = await run(fakeEvent(jar));

		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.session).toBeNull();
		expect(jar.authCookies()).toEqual([]);
		expect(await authSessionExists(sessionId)).toBe(false);
	});

	it("signs out when the policy row belongs to someone else's account", async () => {
		const { jar, sessionId } = await signedInJar();
		const other = await createAuthUser(admin);
		created.push(other.id);
		const otherUser = await ensureAccount(admin, other.id);
		await addPolicy(otherUser.id, sessionId, 'personal', '1 hour', '1 minute');

		const { event } = await run(fakeEvent(jar));
		expect(event.locals.session).toBeNull();
		expect(event.locals.profile).toBeNull();
		expect(jar.authCookies()).toEqual([]);
	});

	it.each([
		['shared, idle for 61 minutes', 'shared', '2 hours', '61 minutes'],
		['shared, older than 8 hours', 'shared', '8 hours 1 minute', '1 minute'],
		['personal, idle for 7 days', 'personal', '8 days', '7 days 1 minute'],
		['personal, older than 30 days', 'personal', '30 days 1 minute', '1 minute']
	] as const)('%s: signs out and redirects to /sign-in?expired=1', async (_l, mode, age, idle) => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, mode, age, idle);

		const { thrown, resolve } = await run(fakeEvent(jar));
		expect(isRedirect(thrown)).toBe(true);
		if (!isRedirect(thrown)) return;
		expect(thrown.status).toBe(303);
		expect(thrown.location).toBe('/sign-in?expired=1');
		expect(resolve).not.toHaveBeenCalled();
		expect(jar.authCookies()).toEqual([]);
		expect(await authSessionExists(sessionId)).toBe(false);
		const [{ count }] = await sql`
			select count(*)::int from public.session_policies where session_id = ${sessionId}
		`;
		expect(count).toBe(0);
	});

	it('does not redirect when the expired session is already on /sign-in', async () => {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'shared', '9 hours', '1 minute');

		const { thrown, resolve, event } = await run(fakeEvent(jar, '/sign-in'));
		expect(thrown).toBeUndefined();
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.session).toBeNull();
	});
});

describe('handleError', () => {
	const event = {
		locals: { requestId: 'req-1', profile: null },
		route: { id: '/x' },
		request: new Request('http://x.test/')
	} as unknown as RequestEvent;

	it('replaces unknown errors with a generic body and logs them', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const body = await handleError({
			kind: 'unknown',
			error: new Error('relation "secret_table" does not exist'),
			event
		});
		expect(body).toMatchObject({ status: 500, code: 'SERVER_ERROR', requestId: 'req-1' });
		expect(JSON.stringify(body)).not.toContain('secret_table');
		expect(String(spy.mock.calls[0][0])).toContain('secret_table');
	});

	it('keeps app errors and 404s, without logging them', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(
			await handleError({
				kind: 'app',
				error: { status: 404, message: 'x', code: 'NOT_FOUND' },
				event
			})
		).toEqual({ code: 'NOT_FOUND', requestId: 'req-1' });
		expect(
			await handleError({ kind: 'framework', error: { status: 404, message: 'Not Found' }, event })
		).toMatchObject({ code: 'NOT_FOUND', requestId: 'req-1' });
		expect(
			await handleError({ kind: 'framework', error: { status: 405, message: 'x' }, event })
		).toEqual({ requestId: 'req-1' });
		expect(spy).not.toHaveBeenCalled();
	});
});
