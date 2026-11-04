import { describe, expect, it } from 'vitest';
import { LAST_SEEN_INTERVAL_MS, SESSION_RULES, amrMethods, evaluateSession } from './session';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = new Date('2026-11-04T12:00:00Z');

function policy(mode: 'personal' | 'shared', ageMs: number, idleMs: number) {
	return {
		mode,
		created_at: new Date(now.getTime() - ageMs).toISOString(),
		last_seen_at: new Date(now.getTime() - idleMs).toISOString()
	};
}

describe('SESSION_RULES', () => {
	it('match auth-spec §5', () => {
		expect(SESSION_RULES).toEqual({
			personal: { lifetimeMs: 30 * DAY, idleMs: 7 * DAY },
			shared: { lifetimeMs: 8 * HOUR, idleMs: 60 * MINUTE }
		});
		expect(LAST_SEEN_INTERVAL_MS).toBe(5 * MINUTE);
	});
});

describe('evaluateSession', () => {
	it.each([
		['personal', 30 * DAY - 1, 0, 'ok'],
		['personal', 30 * DAY, 0, 'expired'],
		['personal', DAY, 7 * DAY - 1, 'touch'],
		['personal', DAY, 7 * DAY, 'expired'],
		['shared', 8 * HOUR - 1, 0, 'ok'],
		['shared', 8 * HOUR, 0, 'expired'],
		['shared', HOUR, 60 * MINUTE - 1, 'touch'],
		['shared', 2 * HOUR, 60 * MINUTE, 'expired']
	] as const)('%s, age %i ms, idle %i ms → %s', (mode, age, idle, expected) => {
		expect(evaluateSession(policy(mode, age, idle), now)).toBe(expected);
	});

	it('writes last_seen_at at most every 5 minutes', () => {
		expect(evaluateSession(policy('personal', HOUR, 5 * MINUTE - 1), now)).toBe('ok');
		expect(evaluateSession(policy('personal', HOUR, 5 * MINUTE), now)).toBe('touch');
	});

	it('treats unreadable timestamps as expired', () => {
		expect(
			evaluateSession({ mode: 'personal', created_at: 'garbage', last_seen_at: 'garbage' }, now)
		).toBe('expired');
	});
});

describe('amrMethods', () => {
	it('reads Supabase objects and plain strings', () => {
		expect(amrMethods([{ method: 'otp', timestamp: 1 }])).toEqual(['otp']);
		expect(amrMethods(['password'])).toEqual(['password']);
		expect(amrMethods(undefined)).toEqual([]);
		expect(amrMethods([null, 3, {}])).toEqual([]);
	});
});
