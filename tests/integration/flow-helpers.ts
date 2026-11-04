import { isActionFailure, isRedirect, type RequestEvent } from '@sveltejs/kit';
import type { Sql } from 'postgres';
import { expect, vi } from 'vitest';
import { actions as signInActions } from '../../src/routes/(auth)/sign-in/+page.server';
import { actions as signUpActions } from '../../src/routes/(auth)/sign-up/+page.server';
import { actions as confirmActions } from '../../src/routes/auth/confirm/+page.server';
import type { Db } from '../../src/lib/server/supabase';
import { env } from './helpers';
import { Jar, fakeEvent, formPost, requestHelpers } from './request-helpers';

// Helpers for tests that drive the auth flows: actions behind the real hook, emails from
// Mailpit, and a stubbed HIBP (no test ever calls the real API).

export const PASSWORD = 'violet harbour lantern quietly';
export const NEW_PASSWORD = 'copper meadow sparrow tuesday';
export const BREACHED = 'breached example password here';

/** Replaces HIBP for the rest of the file: BREACHED is breached, everything else is clean. */
export function stubHibp() {
	const realFetch = globalThis.fetch;
	vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input instanceof Request ? input.url : input);
		if (url.startsWith('https://api.pwnedpasswords.com/')) {
			const { sha1Hex } = await import('../../src/lib/server/password');
			const hash = sha1Hex(BREACHED);
			const body = url.endsWith(hash.slice(0, 5)) ? `${hash.slice(5)}:12` : 'ABC:1';
			return new Response(body);
		}
		return realFetch(input, init);
	});
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type Outcome = { event: RequestEvent; result: unknown; thrown: unknown };

export function redirectTo(outcome: Outcome) {
	expect(isRedirect(outcome.thrown), `expected a redirect, got ${String(outcome.thrown)}`).toBe(
		true
	);
	return isRedirect(outcome.thrown) ? outcome.thrown.location : '';
}

export function failure(outcome: Outcome) {
	expect(outcome.thrown).toBeUndefined();
	expect(isActionFailure(outcome.result)).toBe(true);
	return isActionFailure(outcome.result)
		? (outcome.result as unknown as { status: number; data: Record<string, unknown> })
		: { status: 0, data: {} };
}

/** The newest email to `to` sent at or after `after`, waiting briefly for delivery. */
export async function latestEmail(to: string, after = 0) {
	for (let attempt = 0; attempt < 40; attempt++) {
		const search = await fetch(
			`${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
		).then((r) => r.json());
		const messages = (search.messages ?? []) as { ID: string; Created: string }[];
		const fresh = messages.filter((m) => Date.parse(m.Created) >= after);
		if (fresh.length > 0) {
			return fetch(`${env.mailpitUrl}/api/v1/message/${fresh[0].ID}`).then((r) =>
				r.json()
			) as Promise<{ Subject: string; HTML: string }>;
		}
		await sleep(250);
	}
	throw new Error(`no email to ${to}`);
}

export async function emailCount(to: string) {
	const search = await fetch(
		`${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
	).then((r) => r.json());
	return (search.messages ?? []).length as number;
}

/** The /auth/confirm link in an email, as a path on our site. */
export function confirmLink(html: string) {
	const match = /href="(http:\/\/localhost:5173\/auth\/confirm\?[^"]+)"/.exec(html);
	expect(match, 'confirm link').not.toBeNull();
	const url = new URL(match![1].replaceAll('&amp;', '&'));
	return { path: url.pathname + url.search, tokenHash: url.searchParams.get('token_hash')! };
}

/** Flow helpers bound to a test file's clients. `prefix` marks the file's test addresses. */
export function flowHelpers(admin: Db, sql: Sql, created: string[], prefix: string) {
	const { run } = requestHelpers(admin, sql, created);
	const newEmail = () => `${prefix}-${crypto.randomUUID()}@example.com`;

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

	async function signUp(email: string, password = PASSWORD, ip?: string) {
		const outcome = await call(
			new Jar(),
			'/sign-up',
			signUpActions.default,
			{ email, password },
			ip
		);
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

	/** Deletes the Auth users this file created (by address prefix). */
	async function cleanUp() {
		const ids = await sql`select id from auth.users where email like ${`${prefix}-%@example.com`}`;
		for (const { id } of ids) await admin.auth.admin.deleteUser(id);
	}

	return { newEmail, call, signUp, confirmedUser, authIdOf, policiesOf, signIn, cleanUp };
}
