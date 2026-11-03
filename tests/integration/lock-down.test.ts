import { createClient } from '@supabase/supabase-js';
import { describe, expect, inject, it } from 'vitest';

// Server-only access (data-model §1.5, risk S20): the publishable (anon) key, signed in or not,
// can neither read nor write any public table. Only the secret key can.
const env = inject('supabase');
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const tables = [
	'users',
	'user_app_states',
	'workspaces',
	'workspace_members',
	'session_policies',
	'rate_limits',
	'specialties',
	'sub_specialties',
	'illustrations',
	'specialty_sub_specialties',
	'sub_specialty_illustrations'
];

const legacyTables = ['user_raw', 'organizations', 'teams', 'products', 'subscription_plans'];

describe('public schema lock-down', () => {
	const anon = createClient(env.url, env.publishableKey, clientOptions);
	const admin = createClient(env.url, env.secretKey, clientOptions);

	it.each(tables)('anon cannot read %s', async (table) => {
		const { error } = await anon.from(table).select('*').limit(1);
		expect(error?.code).toBe('42501');
	});

	it('anon cannot write', async () => {
		const { error } = await anon.from('specialties').insert({ name: 'Injected' });
		expect(error?.code).toBe('42501');
	});

	it.each(tables)('a signed-in user cannot read %s', async (table) => {
		const client = createClient(env.url, env.publishableKey, clientOptions);
		const { error: signInError } = await client.auth.signInWithPassword({
			email: 'test-user-2@example.com',
			password: 'local-test-password-two'
		});
		expect(signInError).toBeNull();
		const { error } = await client.from(table).select('*').limit(1);
		expect(error?.code).toBe('42501');
		await client.auth.signOut();
	});

	it.each(tables)('the secret key can read %s', async (table) => {
		const { error } = await admin.from(table).select('*').limit(1);
		expect(error).toBeNull();
	});

	it.each(legacyTables)('legacy table %s is gone', async (table) => {
		const { error } = await admin.from(table).select('*').limit(1);
		// Postgres `undefined_table`, or PostgREST's own "not in the schema cache" code.
		expect(['42P01', 'PGRST205']).toContain(error?.code);
	});
});
