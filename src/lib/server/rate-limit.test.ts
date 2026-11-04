import { describe, expect, it, vi } from 'vitest';
import { RATE_LIMITS, createRateLimiter, ipPrefix, rateLimitKey } from './rate-limit';
import type { Db } from './supabase';

const SECRET = 'unit-test-secret-unit-test-secret-1234';

describe('ipPrefix', () => {
	it.each([
		['203.0.113.42', '203.0.113.0/24'],
		[' 203.0.113.7 ', '203.0.113.0/24'],
		['::ffff:203.0.113.42', '203.0.113.0/24'],
		['::FFFF:203.0.113.42', '203.0.113.0/24'],
		['2001:db8:85a3:1234:0:8a2e:370:7334', '2001:db8:85a3::/48'],
		['2001:0db8:85a3:ffff::1', '2001:db8:85a3::/48'],
		['2001:db8::1', '2001:db8:0::/48'],
		['fe80::1%eth0', 'fe80:0:0::/48'],
		['::1', '0:0:0::/48'],
		['64:ff9b::203.0.113.42', '64:ff9b:0::/48'],
		['not an ip', 'unknown'],
		['', 'unknown']
	])('%j → %j', (ip, prefix) => {
		expect(ipPrefix(ip)).toBe(prefix);
	});
});

describe('rateLimitKey', () => {
	const email = RATE_LIMITS.signInEmail;
	const ip = RATE_LIMITS.signInIp;

	it('is scope:kind:HMAC, without the raw subject', () => {
		const key = rateLimitKey(SECRET, email, 'jane@example.com');
		expect(key).toMatch(/^signin:email:[\w-]{43}$/);
		expect(key).not.toContain('jane');
	});

	it('is stable and ignores email case and spaces', () => {
		expect(rateLimitKey(SECRET, email, ' Jane@Example.com')).toBe(
			rateLimitKey(SECRET, email, 'jane@example.com')
		);
	});

	it('puts addresses in the same /24 or /48 together', () => {
		expect(rateLimitKey(SECRET, ip, '203.0.113.1')).toBe(rateLimitKey(SECRET, ip, '203.0.113.254'));
		expect(rateLimitKey(SECRET, ip, '203.0.113.1')).not.toBe(
			rateLimitKey(SECRET, ip, '203.0.114.1')
		);
		expect(rateLimitKey(SECRET, ip, '2001:db8:1:1::1')).toBe(
			rateLimitKey(SECRET, ip, '2001:db8:1:ffff::2')
		);
		expect(rateLimitKey(SECRET, ip, '203.0.113.1')).not.toContain('203');
	});

	it('differs by scope and by secret', () => {
		const a = rateLimitKey(SECRET, RATE_LIMITS.resetEmail, 'jane@example.com');
		const b = rateLimitKey(SECRET, RATE_LIMITS.resendEmail, 'jane@example.com');
		expect(a.split(':')[2]).not.toBe(b.split(':')[2]);
		expect(rateLimitKey(`${SECRET}x`, email, 'jane@example.com')).not.toBe(
			rateLimitKey(SECRET, email, 'jane@example.com')
		);
	});

	it('fits the rate_limits.key column (200 characters)', () => {
		for (const rule of Object.values(RATE_LIMITS)) {
			expect(rateLimitKey(SECRET, rule, 'x').length).toBeLessThanOrEqual(200);
		}
	});
});

describe('RATE_LIMITS', () => {
	it('matches auth-spec §6', () => {
		const table = Object.fromEntries(
			Object.entries(RATE_LIMITS).map(([name, rule]) => [name, [rule.limit, rule.windowSeconds]])
		);
		expect(table).toEqual({
			signInEmail: [5, 900],
			signInIp: [20, 900],
			signUpIp: [5, 3600],
			resetEmail: [3, 3600],
			resetIp: [10, 3600],
			resendEmail: [3, 3600],
			resendIp: [10, 3600],
			confirmIp: [20, 900],
			feedbackUser: [5, 86400]
		});
	});
});

describe('createRateLimiter', () => {
	/** A fake database: one in-memory counter per key. */
	function fakeDb() {
		const counts = new Map<string, number>();
		const rpc = vi.fn(async (fn: string, args: { p_key: string; p_window_seconds: number }) => {
			if (fn === 'rate_limit_hit') counts.set(args.p_key, (counts.get(args.p_key) ?? 0) + 1);
			return { data: counts.get(args.p_key) ?? 0, error: null };
		});
		return { db: { rpc } as unknown as Db, rpc };
	}

	it('consume allows up to the limit, then refuses', async () => {
		const { db } = fakeDb();
		const limiter = createRateLimiter(db, SECRET);
		const results = [];
		for (let i = 0; i < 4; i++) results.push(await limiter.consume('resetEmail', 'a@example.com'));
		expect(results).toEqual([true, true, true, false]);
	});

	it('isLimited reads without counting', async () => {
		const { db, rpc } = fakeDb();
		const limiter = createRateLimiter(db, SECRET);
		for (let i = 0; i < 5; i++) {
			expect(await limiter.isLimited('signInEmail', 'a@example.com')).toBe(false);
		}
		expect(rpc).not.toHaveBeenCalledWith('rate_limit_hit', expect.anything());
		for (let i = 0; i < 5; i++) await limiter.hit('signInEmail', 'a@example.com');
		expect(await limiter.isLimited('signInEmail', 'a@example.com')).toBe(true);
	});

	it('sends the hashed key and the rule window to the database', async () => {
		const { db, rpc } = fakeDb();
		await createRateLimiter(db, SECRET).hit('confirmIp', '203.0.113.9');
		expect(rpc).toHaveBeenCalledWith('rate_limit_hit', {
			p_key: rateLimitKey(SECRET, RATE_LIMITS.confirmIp, '203.0.113.9'),
			p_window_seconds: 900
		});
	});

	it('throws when the database fails, so the action fails closed', async () => {
		const db = {
			rpc: vi.fn(async () => ({ data: null, error: { message: 'boom' } }))
		} as unknown as Db;
		await expect(createRateLimiter(db, SECRET).consume('signUpIp', '203.0.113.9')).rejects.toThrow(
			'rate_limit_hit failed'
		);
	});
});
