import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { authCookieOptions, cookieMethods } from './supabase';

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
	function fakeEvent(url = 'https://app.postscriptmedical.com/annotate') {
		const set = vi.fn();
		const cookies = {
			getAll: () => [{ name: 'sb-x-auth-token', value: 'v' }],
			set
		} as unknown as Cookies;
		const setHeaders = vi.fn();
		return { event: { cookies, url: new URL(url), setHeaders }, set, setHeaders };
	}

	it('reads all cookies', async () => {
		const { event } = fakeEvent();
		expect(await cookieMethods(event).getAll()).toEqual([{ name: 'sb-x-auth-token', value: 'v' }]);
	});

	it('forces the auth flags over whatever the library asks for, keeping Max-Age', async () => {
		const { event, set } = fakeEvent();
		await cookieMethods(event).setAll?.(
			[
				{
					name: 'sb-x-auth-token',
					value: 'session',
					options: { httpOnly: false, secure: false, sameSite: 'none', path: '/x', maxAge: 60 }
				}
			],
			{}
		);
		expect(set).toHaveBeenCalledWith('sb-x-auth-token', 'session', {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60
		});
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
