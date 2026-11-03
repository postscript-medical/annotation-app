import { createClient } from '@supabase/supabase-js';
import { describe, expect, inject, it } from 'vitest';

// Smoke test for the local stack the integration suite runs on: migrations and seed applied
// (counts from docs/migration-execution-plan.md 0.7) and the seeded test users can sign in.
const env = inject('supabase');
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

describe('local Supabase stack', () => {
	const admin = createClient(env.url, env.secretKey, clientOptions);

	it.each([
		['specialties', 3],
		['sub_specialties', 9],
		['illustrations', 106],
		['specialty_sub_specialties', 9],
		['sub_specialty_illustrations', 183]
	])('seeds %s with %i rows', async (table, expected) => {
		const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
		expect(error).toBeNull();
		expect(count).toBe(expected);
	});

	it('signs in a seeded test user with its password', async () => {
		const client = createClient(env.url, env.publishableKey, clientOptions);
		const { data, error } = await client.auth.signInWithPassword({
			email: 'test-user-1@example.com',
			password: 'local-test-password-one'
		});
		expect(error).toBeNull();
		expect(data.user?.id).toBe('11111111-1111-4111-8111-111111111111');
		await client.auth.signOut();
	});

	it('rejects a wrong password', async () => {
		const client = createClient(env.url, env.publishableKey, clientOptions);
		const { error } = await client.auth.signInWithPassword({
			email: 'test-user-1@example.com',
			password: 'not-the-right-password'
		});
		expect(error?.code).toBe('invalid_credentials');
	});
});
