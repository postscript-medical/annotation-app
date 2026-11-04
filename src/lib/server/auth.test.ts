import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { HOME_PATH, RECOVERY_WINDOW_MS, canResetPassword, clientAddress, nextPath } from './auth';

const now = new Date('2026-11-04T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

function session(amr: string[], recoveryVerifiedAt: string | null) {
	return {
		id: 's',
		authId: 'a',
		mode: 'shared' as const,
		amr,
		recoveryVerifiedAt
	};
}

describe('canResetPassword (auth-spec §4.1 step 3)', () => {
	it('allows a recovery session with a fresh marker', () => {
		expect(canResetPassword(session(['otp'], ago(0)), now)).toBe(true);
		expect(canResetPassword(session(['otp'], ago(RECOVERY_WINDOW_MS - 1)), now)).toBe(true);
	});

	it('refuses a marker of 15 minutes or more', () => {
		expect(canResetPassword(session(['otp'], ago(RECOVERY_WINDOW_MS)), now)).toBe(false);
	});

	it('refuses without the marker, even with amr otp (a sign-up confirmation)', () => {
		expect(canResetPassword(session(['otp'], null), now)).toBe(false);
	});

	it('refuses a marker on a session that did not come from an email link', () => {
		expect(canResetPassword(session(['password'], ago(0)), now)).toBe(false);
	});

	it('refuses no session, and a marker from the future', () => {
		expect(canResetPassword(null, now)).toBe(false);
		expect(canResetPassword(session(['otp'], ago(-60_000)), now)).toBe(false);
	});

	it('the window is 15 minutes', () => {
		expect(RECOVERY_WINDOW_MS).toBe(15 * 60 * 1000);
	});
});

describe('nextPath', () => {
	it('keeps a path on this site and falls back to the app', () => {
		expect(nextPath('/account')).toBe('/account');
		expect(nextPath('https://evil.example/')).toBe(HOME_PATH);
		expect(nextPath(undefined)).toBe(HOME_PATH);
		expect(HOME_PATH).toBe('/annotate');
	});
});

describe('clientAddress', () => {
	it('falls back to one shared bucket if the platform gives no address', () => {
		const event = {
			getClientAddress: () => {
				throw new Error('no address');
			}
		} as unknown as RequestEvent;
		expect(clientAddress(event)).toBe('unknown');
	});
});
