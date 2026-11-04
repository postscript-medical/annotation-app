import { afterAll, describe, expect, it } from 'vitest';
import { RATE_LIMITS, createRateLimiter, rateLimitKey } from '../../src/lib/server/rate-limit';
import { adminClient, publishableClient, sqlClient } from './helpers';

// src/lib/server/rate-limit.ts against the real rate_limit_hit / rate_limit_count functions.
const admin = adminClient();
const sql = sqlClient();
const secret = `integration-${crypto.randomUUID()}`;
const limiter = createRateLimiter(admin, secret);

afterAll(async () => {
	await sql`delete from public.rate_limits where key like any(${[
		'signin:%',
		'reset:%',
		'confirm:%',
		'feedback:%'
	]}::text[]) and window_start > now() - interval '2 days'`;
	await sql.end();
});

describe('rate limiter on Postgres', () => {
	it('counts hits per key in the current window', async () => {
		const email = `${crypto.randomUUID()}@example.com`;
		expect(await limiter.count('signInEmail', email)).toBe(0);
		expect(await limiter.hit('signInEmail', email)).toBe(1);
		expect(await limiter.hit('signInEmail', email)).toBe(2);
		expect(await limiter.count('signInEmail', email)).toBe(2);
		expect(await limiter.count('signInEmail', `other-${email}`)).toBe(0);
	});

	it('stores only the hashed key, in an aligned window', async () => {
		const email = `${crypto.randomUUID()}@example.com`;
		await limiter.hit('resetEmail', email);
		const key = rateLimitKey(secret, RATE_LIMITS.resetEmail, email);
		const rows = await sql`
			select key, count, extract(epoch from window_start)::bigint % 3600 as offset_in_hour
			from public.rate_limits where key = ${key}
		`;
		expect(rows).toEqual([{ key, count: 1, offset_in_hour: '0' }]);
		const [{ leaked }] = await sql`
			select count(*)::int as leaked from public.rate_limits where key like ${`%${email}%`}
		`;
		expect(leaked).toBe(0);
	});

	it('consume refuses once over the limit (3 resets per email per hour)', async () => {
		const email = `${crypto.randomUUID()}@example.com`;
		const results = [];
		for (let i = 0; i < 4; i++) results.push(await limiter.consume('resetEmail', email));
		expect(results).toEqual([true, true, true, false]);
		expect(await limiter.isLimited('resetEmail', email)).toBe(true);
	});

	it('is atomic under concurrent hits', async () => {
		const ip = `198.51.${Math.floor(Math.random() * 255)}.1`;
		const counts = await Promise.all(
			Array.from({ length: 20 }, () => limiter.hit('confirmIp', ip))
		);
		expect([...counts].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
	});

	it('handles the one-day feedback window', async () => {
		const userId = crypto.randomUUID();
		expect(await limiter.hit('feedbackUser', userId)).toBe(1);
	});

	it('refuses a window outside 1 second to 1 day', async () => {
		const { error } = await admin.rpc('rate_limit_hit', { p_key: 'x', p_window_seconds: 0 });
		expect(error?.code).toBe('22023');
	});

	it.each(['rate_limit_hit', 'rate_limit_count'] as const)('anon cannot call %s', async (fn) => {
		const { error } = await publishableClient().rpc(fn, { p_key: 'x', p_window_seconds: 60 });
		expect(error?.code).toBe('42501');
	});
});
