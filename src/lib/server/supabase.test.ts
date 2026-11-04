import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import {
	PERSONAL_COOKIE_MAX_AGE,
	SESSION_MODE_COOKIE,
	authCookieOptions,
	cookieMethods,
	cookieModeFor
} from './supabase';

describe('authCookieOptions', () => {
	it('is httpOnly, Secure, SameSite=Lax on the deployed sites', () => {
		expect(authCookieOptions(new URL('https://staging.app.postscriptmedical.com/'))).toEqual({
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/'
		});
	});

	it.each(['http://localhost:5173/', 'http://127.0.0.1:4173/', 'http://[::1]:5173/'])(
		'drops Secure only for plain-http localhost (%s)',
		(url) => {
			expect(authCookieOptions(new URL(url))).toMatchObject({ httpOnly: true, secure: false });
		}
	);

	it('keeps Secure for any other http host', () => {
		expect(authCookieOptions(new URL('http://app.postscriptmedical.com/')).secure).toBe(true);
	});
});

describe('cookieMethods', () => {
	function fakeEvent(
		{ modeCookie, localsMode }: { modeCookie?: string; localsMode?: 'personal' | 'shared' } = {},
		url = 'https://app.postscriptmedical.com/annotate'
	) {
		const set = vi.fn();
		const cookies = {
			get: (name: string) => (name === SESSION_MODE_COOKIE ? modeCookie : undefined),
			getAll: () => [{ name: 'sb-x-auth-token', value: 'v' }],
			set
		} as unknown as Cookies;
		const setHeaders = vi.fn();
		const locals = localsMode ? { cookieMode: localsMode } : {};
		return { event: { cookies, url: new URL(url), setHeaders, locals }, set, setHeaders };
	}

	const libraryCookie = {
		name: 'sb-x-auth-token',
		value: 'session',
		// What @supabase/ssr asks for: not httpOnly, its own 400-day lifetime.
		options: {
			httpOnly: false,
			secure: false,
			sameSite: 'none' as const,
			path: '/x',
			maxAge: 400 * 24 * 60 * 60
		}
	};

	it('reads all cookies', async () => {
		const { event } = fakeEvent();
		expect(await cookieMethods(event).getAll()).toEqual([{ name: 'sb-x-auth-token', value: 'v' }]);
	});

	it('forces the flags and makes a browser-session cookie when the mode is shared or unknown', async () => {
		for (const options of [{}, { modeCookie: 'shared' }, { modeCookie: 'nonsense' }]) {
			const { event, set } = fakeEvent(options);
			await cookieMethods(event).setAll?.([libraryCookie], {});
			expect(set).toHaveBeenCalledWith('sb-x-auth-token', 'session', {
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				path: '/'
			});
		}
	});

	it('keeps a personal session for 30 days', async () => {
		const { event, set } = fakeEvent({ modeCookie: 'personal' });
		await cookieMethods(event).setAll?.([libraryCookie], {});
		expect(set).toHaveBeenCalledWith('sb-x-auth-token', 'session', {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: PERSONAL_COOKIE_MAX_AGE
		});
		expect(PERSONAL_COOKIE_MAX_AGE).toBe(30 * 24 * 60 * 60);
	});

	it('a sign-in flow choice (locals) wins over the cookie', async () => {
		const { event, set } = fakeEvent({ modeCookie: 'personal', localsMode: 'shared' });
		expect(cookieModeFor(event)).toBe('shared');
		await cookieMethods(event).setAll?.([libraryCookie], {});
		expect(set.mock.calls[0][2]).not.toHaveProperty('maxAge');
	});

	it('keeps deletions as deletions', async () => {
		const { event, set } = fakeEvent({ modeCookie: 'personal' });
		await cookieMethods(event).setAll?.(
			[{ name: 'sb-x-auth-token', value: '', options: { maxAge: 0, path: '/' } }],
			{}
		);
		expect(set).toHaveBeenCalledWith('sb-x-auth-token', '', {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 0
		});
	});

	it('never sets the PKCE code-verifier cookies (email links use token hashes)', async () => {
		const { event, set } = fakeEvent({ modeCookie: 'personal' });
		await cookieMethods(event).setAll?.(
			[
				{ name: 'sb-x-auth-token-code-verifier', value: 'v', options: {} },
				{ name: 'sb-x-auth-token-flow-abc-code-verifier', value: 'v', options: {} },
				{ name: 'sb-x-auth-token', value: 'session', options: {} }
			],
			{}
		);
		expect(set.mock.calls.map(([name]) => name)).toEqual(['sb-x-auth-token']);
	});

	it('passes the no-cache headers on', async () => {
		const { event, setHeaders } = fakeEvent();
		const methods = cookieMethods(event);
		await methods.setAll?.([], { 'Cache-Control': 'private, no-cache, no-store' });
		await methods.setAll?.([], {});
		expect(setHeaders).toHaveBeenCalledTimes(1);
		expect(setHeaders).toHaveBeenCalledWith({ 'Cache-Control': 'private, no-cache, no-store' });
	});
});
