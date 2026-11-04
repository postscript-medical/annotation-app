import { isActionFailure, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	actions as signInActions,
	load as signInLoad
} from '../../src/routes/(auth)/sign-in/+page.server';
import { actions as signUpActions } from '../../src/routes/(auth)/sign-up/+page.server';
import { actions as forgotActions } from '../../src/routes/(auth)/forgot-password/+page.server';
import { actions as resendActions } from '../../src/routes/(auth)/resend-confirmation/+page.server';
import { load as authLayoutLoad } from '../../src/routes/(auth)/+layout.server';
import {
	actions as confirmActions,
	load as confirmLoad
} from '../../src/routes/auth/confirm/+page.server';
import {
	actions as resetActions,
	load as resetLoad
} from '../../src/routes/reset-password/+page.server';
import { actions as logoutActions } from '../../src/routes/logout/+page.server';
import { PERSONAL_COOKIE_MAX_AGE, SESSION_MODE_COOKIE } from '../../src/lib/server/supabase';
import { adminClient, env, publishableClient, sqlClient } from './helpers';
import { Jar, fakeEvent, formPost, requestHelpers } from './request-helpers';

// The sign-up, confirm, sign-in, reset and sign-out flows (auth-spec §4), each behind the real
// hook, against the local stack. Emails are read from Mailpit. HIBP is stubbed: no test calls it.

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { run } = requestHelpers(admin, sql, created);

const PASSWORD = 'violet harbour lantern quietly';
const NEW_PASSWORD = 'copper meadow sparrow tuesday';
const BREACHED = 'breached example password here';

beforeAll(() => {
	const realFetch = globalThis.fetch;
	vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input instanceof Request ? input.url : input);
		if (url.startsWith('https://api.pwnedpasswords.com/')) {
			// One "breached" password; everything else is clean.
			const { sha1Hex } = await import('../../src/lib/server/password');
			const hash = sha1Hex(BREACHED);
			const body = url.endsWith(hash.slice(0, 5)) ? `${hash.slice(5)}:12` : 'ABC:1';
			return new Response(body);
		}
		return realFetch(input, init);
	});
});

afterAll(async () => {
	vi.unstubAllGlobals();
	const ids = await sql`select id from auth.users where email like 'flow-%@example.com'`;
	for (const { id } of ids) await admin.auth.admin.deleteUser(id);
	await sql.end();
});

const newEmail = () => `flow-${crypto.randomUUID()}@example.com`;

type Outcome = { event: RequestEvent; result: unknown; thrown: unknown };

/** Runs the hook, then `handler` (an action or load) as SvelteKit would. */
async function call(
	jar: Jar,
	path: string,
	// Any route's action or load: their event types are per route.
	handler: (event: never) => unknown,
	fields?: Record<string, string>,
	ip?: string
): Promise<Outcome> {
	let result: unknown;
	const event = fakeEvent(jar, path, fields ? formPost(fields) : {}, ip);
	const { thrown } = await run(event, undefined, async (ev) => {
		result = await handler(ev as never);
		return new Response(null);
	});
	return { event, result, thrown };
}

function redirectTo(outcome: Outcome) {
	expect(isRedirect(outcome.thrown), `expected a redirect, got ${String(outcome.thrown)}`).toBe(
		true
	);
	return isRedirect(outcome.thrown) ? outcome.thrown.location : '';
}

function failure(outcome: Outcome) {
	expect(outcome.thrown).toBeUndefined();
	expect(isActionFailure(outcome.result)).toBe(true);
	return isActionFailure(outcome.result)
		? (outcome.result as unknown as { status: number; data: Record<string, unknown> })
		: { status: 0, data: {} };
}

/** The newest email to `to`, waiting briefly for delivery. */
async function latestEmail(to: string, after = 0) {
	for (let attempt = 0; attempt < 40; attempt++) {
		const search = await fetch(
			`${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
		).then((r) => r.json());
		const messages = (search.messages ?? []) as { ID: string; Created: string }[];
		const fresh = messages.filter((m) => Date.parse(m.Created) >= after);
		if (fresh.length > 0) {
			return fetch(`${env.mailpitUrl}/api/v1/message/${fresh[0].ID}`).then((r) =>
				r.json()
			) as Promise<{
				Subject: string;
				HTML: string;
			}>;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`no email to ${to}`);
}

async function emailCount(to: string) {
	const search = await fetch(
		`${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
	).then((r) => r.json());
	return (search.messages ?? []).length as number;
}

/** The /auth/confirm link in an email, as a path on our site. */
function confirmLink(html: string) {
	const match = /href="(http:\/\/localhost:5173\/auth\/confirm\?[^"]+)"/.exec(html);
	expect(match, 'confirm link').not.toBeNull();
	const url = new URL(match![1].replaceAll('&amp;', '&'));
	return { path: url.pathname + url.search, tokenHash: url.searchParams.get('token_hash')! };
}

async function signUp(email: string, password = PASSWORD) {
	const outcome = await call(new Jar(), '/sign-up', signUpActions.default, { email, password });
	expect(outcome.thrown).toBeUndefined();
	return outcome;
}

/** Signs up and confirms through the email link; returns the signed-in jar. */
async function confirmedUser(email = newEmail(), shared = true) {
	const started = Date.now();
	await signUp(email);
	const { tokenHash } = confirmLink((await latestEmail(email, started)).HTML);
	const jar = new Jar();
	const outcome = await call(jar, '/auth/confirm', confirmActions.default, {
		token_hash: tokenHash,
		type: 'signup',
		...(shared ? { shared: 'on' } : {})
	});
	expect(redirectTo(outcome)).toBe('/annotate');
	return { email, jar };
}

async function authIdOf(email: string) {
	const [row] = await sql`select id from auth.users where email = ${email}`;
	return row?.id as string | undefined;
}

async function policiesOf(authId: string) {
	return sql`
		select p.session_id, p.mode, p.recovery_verified_at
		from public.session_policies p join public.users u on u.id = p.user_id
		where u.auth_id = ${authId}
	`;
}

async function signIn(
	email: string,
	password: string,
	extra: Record<string, string> = {},
	ip?: string
) {
	const jar = new Jar();
	const outcome = await call(
		jar,
		'/sign-in',
		signInActions.default,
		{ email, password, ...extra },
		ip
	);
	return { jar, outcome };
}

describe('sign-up and confirmation', () => {
	it('sends a confirmation link and creates nothing in the app until it is used', async () => {
		const email = newEmail();
		const started = Date.now();
		const { result } = await signUp(email);
		expect(result).toEqual({ sent: true, email });

		const message = await latestEmail(email, started);
		expect(message.Subject).toBe('Confirm your PostScript account');
		const { path } = confirmLink(message.HTML);
		expect(path).toMatch(/^\/auth\/confirm\?token_hash=[\w-]+&type=signup$/);
		expect(message.HTML).not.toMatch(/<img/i);

		const authId = (await authIdOf(email))!;
		expect(authId).toBeDefined();
		const [{ count }] = await sql`select count(*)::int from public.users where auth_id = ${authId}`;
		expect(count).toBe(0);
	});

	it('gives the same answer for an address that already has an account', async () => {
		const { email } = await confirmedUser();
		const { result } = await signUp(email, NEW_PASSWORD);
		expect(result).toEqual({ sent: true, email });
	});

	it('explains a rejected password', async () => {
		const short = await call(new Jar(), '/sign-up', signUpActions.default, {
			email: newEmail(),
			password: 'too short'
		});
		expect(failure(short).data.fieldErrors).toMatchObject({
			password: expect.stringContaining('15')
		});

		const breached = await call(new Jar(), '/sign-up', signUpActions.default, {
			email: newEmail(),
			password: BREACHED
		});
		expect(failure(breached).data.fieldErrors).toMatchObject({
			password: expect.stringContaining('data breach')
		});
	});

	it('the confirm page GET verifies nothing (scanner-safe)', async () => {
		const email = newEmail();
		const started = Date.now();
		await signUp(email);
		const { path, tokenHash } = confirmLink((await latestEmail(email, started)).HTML);

		const page = await call(new Jar(), path, confirmLoad as never);
		expect(page.result).toEqual({ valid: true, tokenHash, type: 'signup' });
		const [user] = await sql`select email_confirmed_at from auth.users where email = ${email}`;
		expect(user.email_confirmed_at).toBeNull();
	});

	it('the confirm POST signs in, creates the account and the policy row', async () => {
		const { email, jar } = await confirmedUser(newEmail(), false);
		const authId = (await authIdOf(email))!;
		const [policy] = await policiesOf(authId);
		expect(policy).toMatchObject({ mode: 'personal', recovery_verified_at: null });
		const [{ count }] = await sql`
			select count(*)::int from public.workspace_members m join public.users u on u.id = m.user_id
			where u.auth_id = ${authId}
		`;
		expect(count).toBe(1);
		expect(jar.get(SESSION_MODE_COOKIE)).toBe('personal');
		for (const name of jar.authCookies()) {
			expect(jar.options.get(name)).toMatchObject({
				httpOnly: true,
				sameSite: 'lax',
				maxAge: PERSONAL_COOKIE_MAX_AGE
			});
		}
	});

	it('a link works once', async () => {
		const email = newEmail();
		const started = Date.now();
		await signUp(email);
		const { tokenHash } = confirmLink((await latestEmail(email, started)).HTML);
		const fields = { token_hash: tokenHash, type: 'signup', shared: 'on' };
		expect(redirectTo(await call(new Jar(), '/auth/confirm', confirmActions.default, fields))).toBe(
			'/annotate'
		);
		const again = await call(new Jar(), '/auth/confirm', confirmActions.default, fields);
		expect(failure(again).data.error).toMatchObject({ code: 'LINK_INVALID' });
	});

	it('rejects a malformed link', async () => {
		const page = await call(
			new Jar(),
			'/auth/confirm?token_hash=x&type=magiclink',
			confirmLoad as never
		);
		expect(page.result).toEqual({ valid: false });
	});

	it('resends the confirmation to an unconfirmed address', async () => {
		const email = newEmail();
		const started = Date.now();
		await signUp(email);
		await latestEmail(email, started);
		const before = await emailCount(email);
		// Supabase allows one email per address per max_frequency (1 s locally, 60 s hosted).
		await new Promise((resolve) => setTimeout(resolve, 1100));
		const outcome = await call(new Jar(), '/resend-confirmation', resendActions.default, { email });
		expect(outcome.result).toEqual({ sent: true, email });
		await expect.poll(() => emailCount(email), { timeout: 10_000 }).toBe(before + 1);
	});
});

describe('sign-in', () => {
	it('signs in, records the device choice and goes to next', async () => {
		const { email } = await confirmedUser();
		const { jar, outcome } = await signIn(email, PASSWORD, { shared: 'on', next: '/account' });
		expect(redirectTo(outcome)).toBe('/account');
		expect(jar.get(SESSION_MODE_COOKIE)).toBe('shared');
		for (const name of jar.authCookies())
			expect(jar.options.get(name)).not.toHaveProperty('maxAge');
		const policies = await policiesOf((await authIdOf(email))!);
		expect(policies.map((p) => p.mode).sort()).toEqual(['shared', 'shared']);
	});

	it('ignores a next that leaves the site', async () => {
		const { email } = await confirmedUser();
		const { outcome } = await signIn(email, PASSWORD, { next: '//evil.example/' });
		expect(redirectTo(outcome)).toBe('/annotate');
	});

	it('gives one generic error for a wrong password, an unknown address and an unconfirmed one', async () => {
		const { email } = await confirmedUser();
		const unconfirmed = newEmail();
		await signUp(unconfirmed);

		const results = await Promise.all([
			signIn(email, 'not the right password at all'),
			signIn(newEmail(), PASSWORD),
			signIn(unconfirmed, PASSWORD)
		]);
		const bodies = results.map(({ outcome, jar }) => {
			expect(jar.authCookies()).toEqual([]);
			expect(jar.get(SESSION_MODE_COOKIE)).toBeUndefined();
			const { status, data } = failure(outcome);
			return { status, error: data.error };
		});
		expect(new Set(bodies.map((b) => JSON.stringify(b))).size).toBe(1);
		expect(bodies[0]).toMatchObject({ status: 400, error: { code: 'INVALID_CREDENTIALS' } });
	});

	it('stops after 5 failures for an address, even with the right password', async () => {
		const { email } = await confirmedUser();
		for (let i = 0; i < 5; i++) {
			failure((await signIn(email, `wrong password number ${i}!`)).outcome);
		}
		const { outcome, jar } = await signIn(email, PASSWORD);
		expect(failure(outcome).data.error).toMatchObject({ code: 'INVALID_CREDENTIALS' });
		expect(jar.authCookies()).toEqual([]);
	});

	it('sends a signed-in visitor from the sign-in pages to the app', async () => {
		const { jar } = await confirmedUser();
		expect(redirectTo(await call(jar, '/sign-in', authLayoutLoad as never))).toBe('/annotate');
	});

	it('passes the sign-in page notices through', async () => {
		const page = await call(new Jar(), '/sign-in?expired=1&next=%2Faccount', signInLoad as never);
		expect(page.result).toEqual({ next: '/account', expired: true, deleted: false });
	});
});

describe('password reset', () => {
	async function recoverySession(email: string) {
		const started = Date.now();
		const forgot = await call(new Jar(), '/forgot-password', forgotActions.default, { email });
		expect(forgot.result).toEqual({ sent: true, email });
		const message = await latestEmail(email, started);
		expect(message.Subject).toBe('Reset your PostScript password');
		const { tokenHash, path } = confirmLink(message.HTML);
		expect(path).toContain('type=recovery');
		const jar = new Jar();
		const outcome = await call(jar, '/auth/confirm', confirmActions.default, {
			token_hash: tokenHash,
			type: 'recovery',
			shared: 'on'
		});
		expect(redirectTo(outcome)).toBe('/reset-password');
		return jar;
	}

	it('gives the same answer for an unknown address and sends nothing', async () => {
		const email = newEmail();
		const outcome = await call(new Jar(), '/forgot-password', forgotActions.default, { email });
		expect(outcome.result).toEqual({ sent: true, email });
		await new Promise((resolve) => setTimeout(resolve, 1000));
		expect(await emailCount(email)).toBe(0);
	});

	it('resets the password, signs out other sessions and works only once', async () => {
		const { email, jar: otherDevice } = await confirmedUser();
		const authId = (await authIdOf(email))!;
		const jar = await recoverySession(email);

		const [marked] = (await policiesOf(authId)).filter((p) => p.recovery_verified_at !== null);
		expect(marked).toBeDefined();
		expect((await call(jar, '/reset-password', resetLoad as never)).thrown).toBeUndefined();

		const reset = await call(jar, '/reset-password', resetActions.default, {
			password: NEW_PASSWORD
		});
		expect(redirectTo(reset)).toBe('/annotate');

		// This device stays signed in, with the marker cleared; every other session is gone.
		const policies = await policiesOf(authId);
		expect(policies).toHaveLength(1);
		expect(policies[0]).toMatchObject({
			session_id: marked.session_id,
			recovery_verified_at: null
		});
		const other = await call(otherDevice, '/annotate', () => null);
		expect(other.event.locals.session).toBeNull();

		// One use: the page now sends this session to /forgot-password.
		expect(redirectTo(await call(jar, '/reset-password', resetLoad as never))).toBe(
			'/forgot-password'
		);

		const client = publishableClient();
		expect((await client.auth.signInWithPassword({ email, password: PASSWORD })).error?.code).toBe(
			'invalid_credentials'
		);
		expect(
			(await client.auth.signInWithPassword({ email, password: NEW_PASSWORD })).error
		).toBeNull();
	});

	it('lets a passwordless account (as created at cutover) set its first password', async () => {
		const email = newEmail();
		const { data } = await admin.auth.admin.createUser({ email, email_confirm: true });
		created.push(data.user!.id);
		const jar = await recoverySession(email);
		expect(
			redirectTo(
				await call(jar, '/reset-password', resetActions.default, { password: NEW_PASSWORD })
			)
		).toBe('/annotate');
		const { outcome } = await signIn(email, NEW_PASSWORD);
		expect(redirectTo(outcome)).toBe('/annotate');
	});

	it('refuses a password session, a sign-up confirmation session and an old marker', async () => {
		const { email, jar: confirmationSession } = await confirmedUser();
		expect(redirectTo(await call(confirmationSession, '/reset-password', resetLoad as never))).toBe(
			'/forgot-password'
		);

		const { jar: passwordSession } = await signIn(email, PASSWORD);
		expect(redirectTo(await call(passwordSession, '/reset-password', resetLoad as never))).toBe(
			'/forgot-password'
		);
		expect(
			redirectTo(
				await call(passwordSession, '/reset-password', resetActions.default, {
					password: NEW_PASSWORD
				})
			)
		).toBe('/forgot-password');

		const recovery = await recoverySession(email);
		await sql`
			update public.session_policies set recovery_verified_at = now() - interval '16 minutes'
			where recovery_verified_at is not null
				and user_id = (select id from public.users where auth_id = ${(await authIdOf(email))!})
		`;
		expect(
			redirectTo(
				await call(recovery, '/reset-password', resetActions.default, { password: NEW_PASSWORD })
			)
		).toBe('/forgot-password');
	});

	it('explains a rejected new password', async () => {
		const { email } = await confirmedUser();
		const jar = await recoverySession(email);
		const personal = await call(jar, '/reset-password', resetActions.default, {
			password: `${email} 2026`
		});
		expect(failure(personal).data.fieldErrors).toMatchObject({
			password: expect.stringContaining('email address')
		});
	});
});

describe('sign-out', () => {
	it('revokes the session, deletes its policy row and clears the cookies', async () => {
		const { email, jar } = await confirmedUser();
		const authId = (await authIdOf(email))!;
		const [{ session_id: sessionId }] = await policiesOf(authId);

		expect(redirectTo(await call(jar, '/logout', logoutActions.default, {}))).toBe('/sign-in');
		expect(jar.authCookies()).toEqual([]);
		expect(jar.get(SESSION_MODE_COOKIE)).toBeUndefined();
		expect(await policiesOf(authId)).toEqual([]);
		const [{ count }] = await sql`select count(*)::int from auth.sessions where id = ${sessionId}`;
		expect(count).toBe(0);
	});

	it('a signed-out POST just goes to sign in', async () => {
		expect(redirectTo(await call(new Jar(), '/logout', logoutActions.default, {}))).toBe(
			'/sign-in'
		);
	});
});
