import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { actions as forgotActions } from '../../src/routes/(auth)/forgot-password/+page.server';
import { actions as resendActions } from '../../src/routes/(auth)/resend-confirmation/+page.server';
import { actions as confirmActions } from '../../src/routes/auth/confirm/+page.server';
import {
	PASSWORD,
	emailCount,
	failure,
	flowHelpers,
	latestEmail,
	redirectTo,
	sleep,
	stubHibp
} from './flow-helpers';
import { adminClient, sqlClient } from './helpers';
import { Jar, randomIp } from './request-helpers';

// Every request limit in auth-spec §6, at its threshold, through the real actions. Where the spec
// says "nothing is sent", Mailpit must stay empty for that request. (The 5-per-email sign-in limit
// is in auth-flows.test.ts; feedback arrives in 2.6.)

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { newEmail, call, signUp, confirmedUser, signIn, cleanUp } = flowHelpers(
	admin,
	sql,
	created,
	'limits'
);

beforeAll(stubHibp);
afterAll(async () => {
	vi.unstubAllGlobals();
	await cleanUp();
	await sql.end();
});

/** Waits long enough to be sure an email would have arrived. */
async function settled() {
	await sleep(1500);
}

// Several tests wait for emails (and Supabase's 1 s gap between emails to one address).
describe('rate limits (auth-spec §6)', { timeout: 30_000 }, () => {
	it('failed sign-ins: 20 per network per 15 minutes, then even a correct password is refused', async () => {
		const ip = randomIp();
		const { email } = await confirmedUser();
		for (let i = 0; i < 20; i++) {
			// Different addresses, so the per-email limit (5) isn't what stops it.
			failure((await signIn(newEmail(), PASSWORD, {}, ip)).outcome);
		}
		const blocked = await signIn(email, PASSWORD, {}, ip);
		expect(failure(blocked.outcome).data.error).toMatchObject({ code: 'INVALID_CREDENTIALS' });
		expect(blocked.jar.authCookies()).toEqual([]);

		// Another network is unaffected.
		expect(redirectTo((await signIn(email, PASSWORD, {}, randomIp())).outcome)).toBe('/annotate');
	});

	it('successful sign-ins do not count', async () => {
		const ip = randomIp();
		const { email } = await confirmedUser();
		for (let i = 0; i < 6; i++) {
			expect(redirectTo((await signIn(email, PASSWORD, {}, ip)).outcome)).toBe('/annotate');
		}
	});

	it('sign-up: 5 per network per hour, then the same answer and nothing sent', async () => {
		const ip = randomIp();
		for (let i = 0; i < 5; i++) {
			const email = newEmail();
			const started = Date.now();
			expect((await signUp(email, PASSWORD, ip)).result).toEqual({ sent: true, email });
			await latestEmail(email, started);
		}
		const sixth = newEmail();
		expect((await signUp(sixth, PASSWORD, ip)).result).toEqual({ sent: true, email: sixth });
		await settled();
		expect(await emailCount(sixth)).toBe(0);
		const [{ count }] = await sql`select count(*)::int from auth.users where email = ${sixth}`;
		expect(count).toBe(0);
	});

	for (const [label, path, actions] of [
		['forgot password', '/forgot-password', forgotActions],
		['resend confirmation', '/resend-confirmation', resendActions]
	] as const) {
		it(`${label}: 3 per address per hour, then nothing sent`, async () => {
			// A confirmed address for reset, an unconfirmed one for resend.
			const email = newEmail();
			if (label === 'forgot password') await confirmedUser(email);
			else await signUp(email);
			await settled();
			const before = await emailCount(email);

			for (let i = 0; i < 3; i++) {
				const started = Date.now();
				const outcome = await call(new Jar(), path, actions.default, { email }, randomIp());
				expect(outcome.result).toEqual({ sent: true, email });
				await latestEmail(email, started);
				// Supabase's own gap between emails to one address (1 s locally).
				await sleep(1100);
			}
			expect(await emailCount(email)).toBe(before + 3);

			const fourth = await call(new Jar(), path, actions.default, { email }, randomIp());
			expect(fourth.result).toEqual({ sent: true, email });
			await settled();
			expect(await emailCount(email)).toBe(before + 3);
		});

		it(`${label}: 10 per network per hour, then nothing sent`, async () => {
			const ip = randomIp();
			for (let i = 0; i < 10; i++) {
				const email = newEmail();
				expect((await call(new Jar(), path, actions.default, { email }, ip)).result).toEqual({
					sent: true,
					email
				});
			}
			// The 11th, for an address that would otherwise get an email.
			const email = newEmail();
			if (label === 'forgot password') await confirmedUser(email);
			else await signUp(email);
			await settled();
			const before = await emailCount(email);
			expect((await call(new Jar(), path, actions.default, { email }, ip)).result).toEqual({
				sent: true,
				email
			});
			await settled();
			expect(await emailCount(email)).toBe(before);
		});
	}

	it('confirm page POST: 20 per network per 15 minutes, then refused even with a good link', async () => {
		const ip = randomIp();
		for (let i = 0; i < 20; i++) {
			const outcome = await call(
				new Jar(),
				'/auth/confirm',
				confirmActions.default,
				{ token_hash: `0000000000${i}`, type: 'signup' },
				ip
			);
			expect(failure(outcome).data.error).toMatchObject({ code: 'LINK_INVALID' });
		}
		const outcome = await call(
			new Jar(),
			'/auth/confirm',
			confirmActions.default,
			{ token_hash: '0123456789abcdef', type: 'signup' },
			ip
		);
		const { status, data } = failure(outcome);
		expect(status).toBe(429);
		expect(data.error).toMatchObject({ code: 'RATE_LIMITED' });
	});
});
