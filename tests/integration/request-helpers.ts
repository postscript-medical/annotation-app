import { createServerClient } from '@supabase/ssr';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { Sql } from 'postgres';
import { expect, vi } from 'vitest';
import { createHandle, type HookDeps } from '../../src/hooks.server';
import { authCookieOptions, cookieMethods, type Db } from '../../src/lib/server/supabase';
import type { Database } from '../../src/lib/types/db';
import { createAuthUser, env, sessionIdOf, testPassword } from './helpers';

// Drive the real hooks.server.ts handle (and what runs after it) without an HTTP server:
// a fake RequestEvent, an in-memory cookie jar, and sessions from real password sign-ins.

/** An in-memory cookie jar with SvelteKit's Cookies API (enough for @supabase/ssr). */
export class Jar {
	store = new Map<string, string>();
	options = new Map<string, Record<string, unknown>>();
	get = (name: string) => this.store.get(name);
	getAll = () => [...this.store].map(([name, value]) => ({ name, value }));
	set = (name: string, value: string, options: Record<string, unknown> = {}) => {
		if (options.maxAge === 0 || value === '') {
			this.store.delete(name);
			this.options.delete(name);
		} else {
			this.store.set(name, value);
			this.options.set(name, options);
		}
	};
	delete = (name: string) => {
		this.store.delete(name);
		this.options.delete(name);
	};
	serialize = () => '';
	authCookies = () => [...this.store.keys()].filter((name) => name.startsWith('sb-'));
}

/** A random documentation-range address, so per-network rate limits don't couple tests. */
export function randomIp() {
	const byte = () => Math.floor(Math.random() * 256);
	return `198.18.${byte()}.${byte()}`;
}

export function fakeEvent(
	jar: Jar,
	path = '/annotate',
	init: RequestInit = {},
	ip: string = randomIp()
) {
	const url = new URL(path, 'http://localhost:4173');
	return {
		url,
		request: new Request(url, init),
		cookies: jar as unknown as Cookies,
		locals: {} as App.Locals,
		route: { id: url.pathname },
		setHeaders: vi.fn(),
		getClientAddress: () => ip,
		isDataRequest: false,
		isSubRequest: false,
		params: {},
		platform: undefined,
		fetch
	} as unknown as RequestEvent;
}

/** A form POST as a browser sends it. */
export function formPost(fields: Record<string, string>): RequestInit {
	const body = new URLSearchParams(fields).toString();
	return {
		method: 'POST',
		body,
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			'content-length': String(Buffer.byteLength(body))
		}
	};
}

export function requestHelpers(admin: Db, sql: Sql, created: string[]) {
	function deps(now: () => Date = () => new Date()): HookDeps {
		return {
			ssrClient: (event) =>
				createServerClient<Database>(env.url, env.publishableKey, {
					cookieOptions: authCookieOptions(event.url),
					cookies: cookieMethods(event)
				}),
			admin: () => admin,
			now
		};
	}

	/** Signs in through an SSR client, so the session lands in the jar as auth cookies. */
	async function signedInJar() {
		const { id: authId, email } = await createAuthUser(admin);
		created.push(authId);
		const jar = new Jar();
		const client = deps().ssrClient(fakeEvent(jar));
		const { data, error } = await client.auth.signInWithPassword({ email, password: testPassword });
		expect(error).toBeNull();
		expect(jar.authCookies().length).toBeGreaterThan(0);
		return { jar, authId, sessionId: sessionIdOf(data.session!.access_token) };
	}

	async function addPolicy(
		userId: string,
		sessionId: string,
		mode: 'personal' | 'shared',
		age: string,
		idle: string
	) {
		await sql`
			insert into public.session_policies (session_id, user_id, mode, created_at, last_seen_at)
			values (${sessionId}, ${userId}, ${mode}, now() - ${age}::interval, now() - ${idle}::interval)
		`;
	}

	async function authSessionExists(sessionId: string) {
		const [{ count }] = await sql`select count(*)::int from auth.sessions where id = ${sessionId}`;
		return count === 1;
	}

	/**
	 * Runs the handle with `resolve` standing in for SvelteKit (pass one to run a load or action
	 * after the hook). Returns the event, the response (if any) and anything thrown.
	 */
	async function run(
		event: RequestEvent,
		hookDeps = deps(),
		resolve: (event: RequestEvent) => Promise<Response> = async () => new Response('page')
	) {
		const resolveSpy = vi.fn(resolve);
		try {
			const response = await createHandle(hookDeps)({ event, resolve: resolveSpy });
			return { event, response, resolve: resolveSpy, thrown: undefined as unknown };
		} catch (thrown) {
			return { event, response: undefined, resolve: resolveSpy, thrown };
		}
	}

	return { fakeEvent, deps, signedInJar, addPolicy, authSessionExists, run };
}
