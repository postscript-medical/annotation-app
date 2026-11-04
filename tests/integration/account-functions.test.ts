import { afterAll, describe, expect, it } from 'vitest';
import {
	adminClient,
	createAuthUser,
	ensureAccount as ensureAccountWith,
	publishableClient,
	sqlClient
} from './helpers';

// ensure_account and export_account (data-model §4) and invariants §5.1–5.5.
const admin = adminClient();
const sql = sqlClient(10);
const created: string[] = [];

async function newAuthUser(options?: { confirmed?: boolean }) {
	const user = await createAuthUser(admin, options);
	created.push(user.id);
	return user;
}

const ensureAccount = (authId: string) => ensureAccountWith(admin, authId);

type Named = { id: string; name: string } | null;

/** The shape export_account returns (the generated type is plain `Json`). */
type AccountExport = {
	exported_at: string;
	login: {
		email: string;
		created_at: string;
		email_confirmed_at: string | null;
		last_sign_in_at: string | null;
	};
	account: { id: string; created_at: string } | null;
	workspaces: Record<string, unknown>[];
	app_state: {
		selected_specialty: Named;
		selected_sub_specialty: Named;
		selected_illustration: Named;
	} | null;
	sessions: { mode: string; created_at: string; last_seen_at: string }[];
};

async function exportAccount(authId: string) {
	const { data, error } = await admin.rpc('export_account', { p_auth_id: authId });
	expect(error).toBeNull();
	return data as AccountExport | null;
}

/** Rows the app holds for one user, keyed by table. */
async function accountRows(userId: string) {
	const [counts] = await sql`
		select
			(select count(*) from public.users where id = ${userId})::int as users,
			(select count(*) from public.user_app_states where user_id = ${userId})::int as app_states,
			(select count(*) from public.workspace_members where user_id = ${userId})::int as memberships,
			(select count(*) from public.workspaces where personal_owner_id = ${userId})::int as personal_workspaces,
			(select count(*) from public.session_policies where user_id = ${userId})::int as session_policies
	`;
	return counts;
}

/** Invariants data-model §5.1–5.3 across the whole database. */
async function assertGlobalInvariants() {
	const [result] = await sql`
		select
			(select count(*) from public.users as u
				where not exists (select 1 from public.user_app_states as s where s.user_id = u.id))::int
				as users_without_app_state,
			(select count(*) from public.users as u
				where not exists (select 1 from public.workspace_members as m where m.user_id = u.id))::int
				as users_without_membership,
			(select count(*) from public.workspaces as w
				where w.kind = 'personal'
				and (
					(select count(*) from public.workspace_members as m where m.workspace_id = w.id) <> 1
					or not exists (
						select 1 from public.workspace_members as m
						where m.workspace_id = w.id and m.user_id = w.personal_owner_id and m.role = 'owner'
					)
				))::int as bad_personal_workspaces
	`;
	expect(result).toEqual({
		users_without_app_state: 0,
		users_without_membership: 0,
		bad_personal_workspaces: 0
	});
}

afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id);
	await sql.end();
});

describe('ensure_account', () => {
	it('creates the user, personal workspace, owner membership and app state', async () => {
		const { id: authId } = await newAuthUser();
		const user = await ensureAccount(authId);

		expect(user.auth_id).toBe(authId);
		expect(Object.keys(user).sort()).toEqual(['auth_id', 'created_at', 'id']);
		expect(await accountRows(user.id)).toEqual({
			users: 1,
			app_states: 1,
			memberships: 1,
			personal_workspaces: 1,
			session_policies: 0
		});

		const [membership] = await sql`
			select w.kind, w.name, m.role
			from public.workspace_members as m
			join public.workspaces as w on w.id = m.workspace_id
			where m.user_id = ${user.id} and w.personal_owner_id = ${user.id}
		`;
		expect(membership).toEqual({ kind: 'personal', name: null, role: 'owner' });
		await assertGlobalInvariants();
	});

	it('is idempotent', async () => {
		const { id: authId } = await newAuthUser();
		const first = await ensureAccount(authId);
		const second = await ensureAccount(authId);
		const third = await ensureAccount(authId);

		expect(second).toEqual(first);
		expect(third).toEqual(first);
		expect(await accountRows(first.id)).toMatchObject({
			users: 1,
			app_states: 1,
			memberships: 1,
			personal_workspaces: 1
		});
	});

	it('is safe under concurrent calls (separate connections)', async () => {
		const { id: authId } = await newAuthUser();
		const results = await Promise.all(
			Array.from({ length: 10 }, () => sql`select (public.ensure_account(${authId})).id`)
		);
		const ids = new Set(results.map(([row]) => row.id));
		expect(ids.size).toBe(1);

		const [userId] = ids;
		expect(await accountRows(userId)).toMatchObject({
			users: 1,
			app_states: 1,
			memberships: 1,
			personal_workspaces: 1
		});
		await assertGlobalInvariants();
	});

	it('is safe under concurrent calls through the API', async () => {
		const { id: authId } = await newAuthUser();
		const results = await Promise.all(
			Array.from({ length: 10 }, () => admin.rpc('ensure_account', { p_auth_id: authId }))
		);
		for (const { error } of results) expect(error).toBeNull();
		const ids = new Set(results.map(({ data }) => data?.id));
		expect(ids.size).toBe(1);
		expect(await accountRows(results[0].data!.id)).toMatchObject({
			users: 1,
			memberships: 1,
			personal_workspaces: 1
		});
	});

	it('gives a user with no memberships a fresh personal workspace', async () => {
		const { id: authId } = await newAuthUser();
		const user = await ensureAccount(authId);
		await sql`delete from public.workspaces where personal_owner_id = ${user.id}`;
		expect(await accountRows(user.id)).toMatchObject({ memberships: 0, personal_workspaces: 0 });

		expect(await ensureAccount(authId)).toEqual(user);
		expect(await accountRows(user.id)).toMatchObject({
			app_states: 1,
			memberships: 1,
			personal_workspaces: 1
		});
		await assertGlobalInvariants();
	});

	it('restores a missing app state and owner membership', async () => {
		const { id: authId } = await newAuthUser();
		const user = await ensureAccount(authId);
		await sql`delete from public.user_app_states where user_id = ${user.id}`;
		await sql`delete from public.workspace_members where user_id = ${user.id}`;

		await ensureAccount(authId);
		expect(await accountRows(user.id)).toMatchObject({
			app_states: 1,
			memberships: 1,
			personal_workspaces: 1
		});
		await assertGlobalInvariants();
	});

	it('refuses an id with no Auth user', async () => {
		const { error } = await admin.rpc('ensure_account', { p_auth_id: crypto.randomUUID() });
		expect(error?.code).toBe('23503');
	});
});

describe('export_account', () => {
	it('returns what we hold, without secrets', async () => {
		const { id: authId, email } = await newAuthUser();
		const user = await ensureAccount(authId);
		const sessionId = crypto.randomUUID();
		await sql`
			insert into public.session_policies (session_id, user_id, mode)
			values (${sessionId}, ${user.id}, 'shared')
		`;

		const data = (await exportAccount(authId))!;

		expect(data.login).toMatchObject({ email });
		expect(data.login.created_at).toEqual(expect.any(String));
		expect(data.login.email_confirmed_at).toEqual(expect.any(String));
		expect(data.account).toEqual({ id: user.id, created_at: expect.any(String) });
		expect(data.workspaces).toEqual([
			expect.objectContaining({ kind: 'personal', name: null, personal: true, role: 'owner' })
		]);
		expect(data.app_state).toEqual({
			selected_specialty: null,
			selected_sub_specialty: null,
			selected_illustration: null
		});
		expect(data.sessions).toEqual([
			{ mode: 'shared', created_at: expect.any(String), last_seen_at: expect.any(String) }
		]);

		const json = JSON.stringify(data);
		expect(json).not.toContain(sessionId);
		expect(json).not.toMatch(/password|\$2[aby]\$|token/i);
	});

	it('names the selected catalogue items', async () => {
		const { id: authId } = await newAuthUser();
		const user = await ensureAccount(authId);
		const [specialty] = await sql`select id, name from public.specialties order by name limit 1`;
		await sql`
			update public.user_app_states set selected_specialty_id = ${specialty.id}
			where user_id = ${user.id}
		`;

		const data = await exportAccount(authId);
		expect(data?.app_state?.selected_specialty).toEqual({ id: specialty.id, name: specialty.name });
	});

	it('works before the app account exists', async () => {
		const { id: authId, email } = await newAuthUser({ confirmed: false });
		expect(await exportAccount(authId)).toMatchObject({
			login: { email, email_confirmed_at: null },
			account: null,
			workspaces: [],
			app_state: null,
			sessions: []
		});
	});

	it('returns null for an unknown id', async () => {
		expect(await exportAccount(crypto.randomUUID())).toBeNull();
	});
});

describe('account deletion', () => {
	it('cascades from auth.users to every public row (invariant 5.4)', async () => {
		const { id: authId } = await createAuthUser(admin);
		const user = await ensureAccount(authId);
		await sql`
			insert into public.session_policies (session_id, user_id, mode)
			values (${crypto.randomUUID()}, ${user.id}, 'personal')
		`;
		const [{ workspace_id: workspaceId }] = await sql`
			select workspace_id from public.workspace_members where user_id = ${user.id}
		`;

		const { error } = await admin.auth.admin.deleteUser(authId);
		expect(error).toBeNull();

		expect(await accountRows(user.id)).toEqual({
			users: 0,
			app_states: 0,
			memberships: 0,
			personal_workspaces: 0,
			session_policies: 0
		});
		const [{ count }] = await sql`
			select count(*)::int from public.workspaces where id = ${workspaceId}
		`;
		expect(count).toBe(0);
	});
});

describe('schema', () => {
	it('holds no email address, name or IP address column (invariant 5.5)', async () => {
		// workspaces.name is an organisation's name and the catalogue's `name` columns are
		// illustration labels; neither is about a person.
		const columns = await sql`
			select table_name || '.' || column_name as column
			from information_schema.columns
			where table_schema = 'public'
				and (
					column_name ~* '(e_?mail|first_?name|last_?name|full_?name|surname|given_?name|family_?name|phone|(^|_)ip($|_)|ip_?addr)'
					or data_type in ('inet', 'cidr')
				)
		`;
		expect(columns).toEqual([]);
	});
});

describe('function privileges', () => {
	const calls = [
		['ensure_account', { p_auth_id: '11111111-1111-4111-8111-111111111111' }],
		['export_account', { p_auth_id: '11111111-1111-4111-8111-111111111111' }],
		['purge_unconfirmed_signups', {}],
		['purge_expired_sessions', {}],
		['purge_rate_limits', {}]
	] as const;

	it.each(calls)('anon cannot call %s', async (fn, args) => {
		const { error } = await publishableClient().rpc(fn, args);
		expect(error?.code).toBe('42501');
	});

	it.each(calls)('a signed-in user cannot call %s', async (fn, args) => {
		const client = publishableClient();
		const { error: signInError } = await client.auth.signInWithPassword({
			email: 'test-user-1@example.com',
			password: 'local-test-password-one'
		});
		expect(signInError).toBeNull();
		const { error } = await client.rpc(fn, args);
		expect(error?.code).toBe('42501');
		await client.auth.signOut();
	});

	it('are all security definer with an empty search_path', async () => {
		const rows = await sql`
			select p.proname, p.prosecdef, p.proconfig
			from pg_proc as p
			where p.pronamespace = 'public'::regnamespace
				and p.proname = any(${calls.map(([fn]) => fn)})
			order by p.proname
		`;
		expect(rows).toHaveLength(calls.length);
		for (const row of rows) {
			expect(row.prosecdef).toBe(true);
			expect(row.proconfig).toEqual(['search_path=""']);
		}
	});
});
