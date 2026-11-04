import { afterAll, describe, expect, it } from 'vitest';
import {
	adminClient,
	createAuthUser,
	publishableClient,
	sessionIdOf,
	sqlClient,
	testPassword
} from './helpers';

// The purge functions and their pg_cron schedules (data-model §4, data-protection §6).
const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];

async function newAuthUser(options?: { confirmed?: boolean }) {
	const user = await createAuthUser(admin, options);
	created.push(user.id);
	return user;
}

async function purge(fn: string) {
	const { data, error } = await admin.rpc(fn);
	expect(error).toBeNull();
	return data as number;
}

afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id);
	await sql.end();
});

describe('purge_unconfirmed_signups', () => {
	it('deletes sign-ups unconfirmed for more than 24 hours, and only those', async () => {
		const stale = await newAuthUser({ confirmed: false });
		const fresh = await newAuthUser({ confirmed: false });
		const confirmedOld = await newAuthUser({ confirmed: true });
		await sql`
			update auth.users set created_at = now() - interval '25 hours'
			where id in ${sql([stale.id, confirmedOld.id])}
		`;
		// A cutover account: confirmed, no password, old.
		const passwordless = await newAuthUser({ confirmed: true });
		await sql`
			update auth.users set encrypted_password = '', created_at = now() - interval '2 years'
			where id = ${passwordless.id}
		`;

		expect(await purge('purge_unconfirmed_signups')).toBeGreaterThanOrEqual(1);

		const remaining = await sql`
			select id from auth.users
			where id in ${sql([stale.id, fresh.id, confirmedOld.id, passwordless.id])}
		`;
		expect(remaining.map((r) => r.id).sort()).toEqual(
			[fresh.id, confirmedOld.id, passwordless.id].sort()
		);
		// auth.* children cascade.
		const [{ count }] = await sql`
			select count(*)::int from auth.identities where user_id = ${stale.id}
		`;
		expect(count).toBe(0);
	});
});

describe('purge_expired_sessions', () => {
	/** Signs in once and records a session policy created `age` ago. */
	async function sessionWithPolicy(userId: string, email: string, mode: string, age: string) {
		const client = publishableClient();
		const { data, error } = await client.auth.signInWithPassword({ email, password: testPassword });
		expect(error).toBeNull();
		const sessionId = sessionIdOf(data.session!.access_token);
		await sql`
			insert into public.session_policies (session_id, user_id, mode, created_at, last_seen_at)
			values (${sessionId}, ${userId}, ${mode}, now() - ${age}::interval, now())
		`;
		return sessionId;
	}

	it('deletes policies past their absolute lifetime and their auth sessions', async () => {
		const { id: authId, email } = await newAuthUser();
		const { data: user } = await admin.rpc('ensure_account', { p_auth_id: authId });

		const sharedExpired = await sessionWithPolicy(user.id, email, 'shared', '8 hours 1 minute');
		const sharedLive = await sessionWithPolicy(user.id, email, 'shared', '7 hours 59 minutes');
		const personalExpired = await sessionWithPolicy(user.id, email, 'personal', '30 days 1 minute');
		const personalLive = await sessionWithPolicy(user.id, email, 'personal', '29 days 23 hours');

		expect(await purge('purge_expired_sessions')).toBeGreaterThanOrEqual(2);

		const policies = await sql`
			select session_id from public.session_policies where user_id = ${user.id}
		`;
		expect(policies.map((r) => r.session_id).sort()).toEqual([sharedLive, personalLive].sort());

		const sessions = await sql`select id from auth.sessions where user_id = ${authId}`;
		expect(sessions.map((r) => r.id).sort()).toEqual([sharedLive, personalLive].sort());

		// Refresh tokens of the purged sessions cascade.
		const [{ count }] = await sql`
			select count(*)::int from auth.refresh_tokens
			where session_id in ${sql([sharedExpired, personalExpired])}
		`;
		expect(count).toBe(0);
	});

	it('deletes auth sessions older than a day that have no policy, and only those', async () => {
		const { id: authId, email } = await newAuthUser();
		const { data: user } = await admin.rpc('ensure_account', { p_auth_id: authId });

		async function signIn() {
			const { data, error } = await publishableClient().auth.signInWithPassword({
				email,
				password: testPassword
			});
			expect(error).toBeNull();
			return sessionIdOf(data.session!.access_token);
		}
		const orphanOld = await signIn();
		const orphanFresh = await signIn();
		const withPolicyOld = await sessionWithPolicy(user.id, email, 'personal', '2 days');
		await sql`
			update auth.sessions set created_at = now() - interval '1 day 1 minute'
			where id in ${sql([orphanOld, withPolicyOld])}
		`;

		expect(await purge('purge_expired_sessions')).toBeGreaterThanOrEqual(1);

		const sessions = await sql`select id from auth.sessions where user_id = ${authId}`;
		expect(sessions.map((r) => r.id).sort()).toEqual([orphanFresh, withPolicyOld].sort());
		const [{ count }] = await sql`
			select count(*)::int from auth.refresh_tokens where session_id = ${orphanOld}
		`;
		expect(count).toBe(0);
	});
});

describe('purge_rate_limits', () => {
	it('deletes rows older than 24 hours', async () => {
		const prefix = `it:${crypto.randomUUID()}`;
		await sql`
			insert into public.rate_limits (key, window_start, count) values
				(${`${prefix}:old`}, now() - interval '24 hours 1 minute', 3),
				(${`${prefix}:recent`}, now() - interval '23 hours 59 minutes', 2)
		`;

		expect(await purge('purge_rate_limits')).toBeGreaterThanOrEqual(1);

		const rows = await sql`select key from public.rate_limits where key like ${`${prefix}:%`}`;
		expect(rows.map((r) => r.key)).toEqual([`${prefix}:recent`]);
		await sql`delete from public.rate_limits where key like ${`${prefix}:%`}`;
	});
});

describe('pg_cron schedules', () => {
	it('runs the three purges as postgres', async () => {
		const jobs = await sql`
			select jobname, schedule, command, username, active
			from cron.job
			order by jobname
		`;
		expect(jobs).toEqual([
			{
				jobname: 'purge-expired-sessions',
				schedule: '27 3 * * *',
				command: 'select public.purge_expired_sessions()',
				username: 'postgres',
				active: true
			},
			{
				jobname: 'purge-rate-limits',
				schedule: '7 * * * *',
				command: 'select public.purge_rate_limits()',
				username: 'postgres',
				active: true
			},
			{
				jobname: 'purge-unconfirmed-signups',
				schedule: '17 3 * * *',
				command: 'select public.purge_unconfirmed_signups()',
				username: 'postgres',
				active: true
			}
		]);
	});

	it('the scheduled commands run as postgres', async () => {
		// What pg_cron executes, run the same way, so a privilege problem shows up here.
		const [row] = await sql`
			select
				current_user as role,
				public.purge_rate_limits() >= 0 as rate_limits,
				public.purge_unconfirmed_signups() >= 0 as unconfirmed_signups,
				public.purge_expired_sessions() >= 0 as expired_sessions
		`;
		expect(row).toEqual({
			role: 'postgres',
			rate_limits: true,
			unconfirmed_signups: true,
			expired_sessions: true
		});
	});
});
