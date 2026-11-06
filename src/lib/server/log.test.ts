import { afterEach, describe, expect, it, vi } from 'vitest';
import { log, redact, type LogFields } from './log';

afterEach(() => vi.restoreAllMocks());

function captured(spy: { mock: { calls: unknown[][] } }) {
	return JSON.parse(String(spy.mock.calls[0][0]));
}

describe('redact', () => {
	it.each([
		['email', 'User jane.doe+ps@example.nhs.uk already registered', '[email]'],
		['IPv4', 'from 203.0.113.42 blocked', '[ip]'],
		['IPv6', 'from 2001:db8:85a3:0:0:8a2e:370:7334 blocked', '[ip]'],
		['compressed IPv6', 'from 2001:db8::1 blocked', '[ip]'],
		['JWT', 'token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl rejected', '[jwt]'],
		['secret key', 'key sb_secret_abc123XYZ used', '[key]'],
		['bearer token', 'Authorization: Bearer abc.def-ghi', 'Bearer [token]'],
		[
			'token hash',
			'hash 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 bad',
			'[hex]'
		]
	])('removes an %s', (_label, input, marker) => {
		const output = redact(input);
		expect(output).toContain(marker);
		expect(output).not.toMatch(/@example|203\.0\.113|2001:db8|eyJ|sb_secret_abc|abc\.def|9f86d08/);
	});

	it('leaves times, ids and stack positions alone', () => {
		const text = 'at 12:30:45 in /src/lib/abc.ts:120:15 for 11111111-1111-4111-8111-111111111111';
		expect(redact(text)).toBe(text);
	});
});

describe('log', () => {
	it('writes one JSON line with allowed fields only', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const fields = {
			requestId: 'req-1',
			userId: 'user-1',
			route: '/',
			email: 'jane@example.com',
			ip: '203.0.113.42',
			password: 'hunter2hunter2hunter2'
		} as LogFields;
		log.info('signed_in', fields);

		const entry = captured(spy);
		expect(entry).toMatchObject({
			level: 'info',
			event: 'signed_in',
			requestId: 'req-1',
			userId: 'user-1',
			route: '/'
		});
		expect(entry).not.toHaveProperty('email');
		expect(entry).not.toHaveProperty('ip');
		expect(entry).not.toHaveProperty('password');
		expect(String(spy.mock.calls[0][0])).not.toMatch(/jane|203\.0|hunter2/);
	});

	it('scrubs error messages and stacks', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const cause = Object.assign(new Error('Email jane@example.com from 203.0.113.42 invalid'), {
			code: 'email_address_invalid',
			status: 400
		});
		log.error('sign_up_failed', cause, { requestId: 'req-2' });

		const entry = captured(spy);
		expect(entry.error).toMatchObject({
			name: 'Error',
			message: 'Email [email] from [ip] invalid',
			code: 'email_address_invalid',
			status: 400
		});
		expect(String(spy.mock.calls[0][0])).not.toMatch(/jane@|203\.0\.113/);
	});

	it('records only the type of a thrown non-Error', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		log.error('weird', { email: 'jane@example.com' });
		expect(captured(spy).error).toEqual({ name: 'object' });
	});

	it('uses console.warn for warnings', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		log.warn('hibp_unavailable', { code: 'HIBP_FALLBACK' });
		expect(captured(spy)).toMatchObject({ level: 'warn', code: 'HIBP_FALLBACK' });
	});
});
