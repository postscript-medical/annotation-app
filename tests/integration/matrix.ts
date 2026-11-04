import { isActionFailure, isHttpError, isRedirect, type RequestEvent } from '@sveltejs/kit';
import type { Sql } from 'postgres';
import { expect } from 'vitest';
import type { Db } from '../../src/lib/server/supabase';
import { ensureAccount } from './helpers';
import { Jar, fakeEvent, formPost, requestHelpers } from './request-helpers';

/**
 * The authorization matrix (auth-spec §7.3): every route × caller, run through the real hook.
 * A row names the handler SvelteKit would run (a layout/page load or an action) and what each
 * caller must get. Rows are added as routes land (1.12 account, 2.4 annotate).
 */

export type Caller = 'anon' | 'user' | 'other';

/** The signed-in caller and, for "other user's resource" rows, the account whose resource it is. */
export type Context = { self?: Account; other?: Account };
export type Account = { jar: Jar; authId: string; userId: string; sessionId: string };

export type Expectation =
	/** Runs: no redirect, no HTTP error (a form validation failure is still "allowed"). */
	| { allow: true; check?: (ctx: Context) => Promise<void> }
	| { redirect: string | RegExp; check?: (ctx: Context) => Promise<void> }
	| { status: 403 | 404; check?: (ctx: Context) => Promise<void> };

export type Row = {
	name: string;
	path: string;
	/** A load or action, any route's (their event types are per route). */
	handler: (event: never) => unknown;
	/** Form fields for an action; may refer to the other account's resources. */
	fields?: (ctx: Context) => Record<string, string>;
	expect: Partial<Record<Caller, Expectation>>;
};

export function matrixHelpers(admin: Db, sql: Sql, created: string[]) {
	const { signedInJar, addPolicy, run } = requestHelpers(admin, sql, created);

	/** A fresh signed-in account with a valid personal session. */
	async function account(): Promise<Account> {
		const { jar, authId, sessionId } = await signedInJar();
		const user = await ensureAccount(admin, authId);
		await addPolicy(user.id, sessionId, 'personal', '1 minute', '1 minute');
		return { jar, authId, userId: user.id, sessionId };
	}

	async function contextFor(caller: Caller): Promise<Context> {
		if (caller === 'anon') return {};
		if (caller === 'user') return { self: await account() };
		return { self: await account(), other: await account() };
	}

	/** Runs one cell of the matrix and checks the outcome. */
	async function check(row: Row, caller: Caller, expected: Expectation) {
		const ctx = await contextFor(caller);
		const jar = ctx.self?.jar ?? new Jar();
		const fields = row.fields?.(ctx);
		let result: unknown;
		const event = fakeEvent(jar, row.path, fields ? formPost(fields) : {});
		const { thrown } = await run(event, undefined, async (ev: RequestEvent) => {
			result = await row.handler(ev as never);
			return new Response(null);
		});

		if ('status' in expected) {
			expect(isHttpError(thrown), `${row.name} as ${caller}: expected ${expected.status}`).toBe(
				true
			);
			if (isHttpError(thrown)) expect(thrown.status).toBe(expected.status);
			await expected.check?.(ctx);
			return;
		}
		if ('redirect' in expected) {
			expect(isRedirect(thrown), `${row.name} as ${caller}: expected a redirect`).toBe(true);
			if (isRedirect(thrown)) {
				if (typeof expected.redirect === 'string') expect(thrown.location).toBe(expected.redirect);
				else expect(thrown.location).toMatch(expected.redirect);
			}
		} else {
			expect(thrown, `${row.name} as ${caller}: expected to run`).toBeUndefined();
			if (isActionFailure(result)) {
				// A validation failure is fine; an auth-shaped failure is not "allowed".
				expect([401, 403]).not.toContain(result.status);
			}
		}
		await expected.check?.(ctx);
	}

	return { check, account };
}

/** Flattens rows into it.each cases: [row name, caller, row, expectation]. */
export function cells(rows: Row[]) {
	return rows.flatMap((row) =>
		(Object.entries(row.expect) as [Caller, Expectation][]).map(
			([caller, expectation]) => [row.name, caller, row, expectation] as const
		)
	);
}
