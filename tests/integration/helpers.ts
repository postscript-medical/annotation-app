import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { inject } from 'vitest';
import type { Database } from '../../src/lib/types/db';

// Shared helpers for integration tests against the local Supabase stack (see global-setup.ts).
export const env = inject('supabase');
export const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export function adminClient(): SupabaseClient<Database> {
	return createClient<Database>(env.url, env.secretKey, clientOptions);
}

export function publishableClient(): SupabaseClient<Database> {
	return createClient<Database>(env.url, env.publishableKey, clientOptions);
}

/** Direct Postgres connection (as `postgres`), for `auth.*` and for backdating rows. */
export function sqlClient(max = 4) {
	return postgres(env.dbUrl, { max, onnotice: () => {} });
}

export const testPassword = 'integration-test-password-long';

/** Creates a fresh Auth user (no app account yet) and returns its id and email. */
export async function createAuthUser(
	admin: SupabaseClient<Database>,
	{ confirmed = true }: { confirmed?: boolean } = {}
) {
	const email = `it-${crypto.randomUUID()}@example.com`;
	const { data, error } = await admin.auth.admin.createUser({
		email,
		password: testPassword,
		email_confirm: confirmed
	});
	if (error || !data.user) throw error ?? new Error('createUser returned no user');
	return { id: data.user.id, email };
}

/** Reads the `session_id` claim from an access token. */
export function sessionIdOf(accessToken: string): string {
	const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
	return payload.session_id;
}

/** Calls `ensure_account` with the secret key and returns the `users` row. */
export async function ensureAccount(admin: SupabaseClient<Database>, authId: string) {
	const { data, error } = await admin.rpc('ensure_account', { p_auth_id: authId });
	if (error || !data) throw error ?? new Error('ensure_account returned no row');
	return data;
}
