import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

// Support for the E2E journeys: the LOCAL Supabase stack only (Mailpit, the database, the Admin
// API), read from `npx supabase status`. Any non-local host is refused.

function localStack() {
	// E2E_STACK: the same JSON, for runs where the CLI can't reach Docker (e.g. WebKit in the
	// Playwright container).
	const output =
		process.env.E2E_STACK ??
		execFileSync('npx', ['supabase', 'status', '-o', 'json'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		});
	const status = JSON.parse(output.slice(output.indexOf('{')));
	for (const url of [status.API_URL, status.DB_URL, status.MAILPIT_URL]) {
		const host = new URL(url).hostname;
		if (host !== '127.0.0.1' && host !== 'localhost') {
			throw new Error(`Refusing to run E2E support against a non-local host: ${host}`);
		}
	}
	return status as { API_URL: string; DB_URL: string; MAILPIT_URL: string; SECRET_KEY: string };
}

const stack = localStack();
// Idle connections close themselves: several test files share this module in one worker.
export const sql = postgres(stack.DB_URL, { max: 2, idle_timeout: 1, onnotice: () => {} });
export const admin = createClient(stack.API_URL, stack.SECRET_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});

export const PASSWORD = 'violet harbour lantern quietly';
export const NEW_PASSWORD = 'copper meadow sparrow tuesday';
/** Addresses this worker made; cleanUp deletes only these (other workers run in parallel). */
const madeHere = new Set<string>();
export const newEmail = () => {
	const email = `e2e-${crypto.randomUUID()}@example.com`;
	madeHere.add(email);
	return email;
};

/**
 * Every browser request comes from this machine, so our per-network limits (auth-spec §6) would
 * build up across runs. Each journey starts with none.
 */
export async function clearRateLimits() {
	await sql`delete from public.rate_limits`;
}

/** A confirmed account with a password, made through the Admin API (no email). */
export async function confirmedAccount(
	email = newEmail(),
	password: string | undefined = PASSWORD
) {
	const { data, error } = await admin.auth.admin.createUser({
		email,
		...(password ? { password } : {}),
		email_confirm: true
	});
	if (error || !data.user) throw error ?? new Error('createUser failed');
	return { email, authId: data.user.id };
}

/** The /auth/confirm path from the newest email to `to` sent at or after `after`. */
export async function confirmPathFromEmail(to: string, after: number) {
	for (let attempt = 0; attempt < 60; attempt++) {
		const search = await fetch(
			`${stack.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
		).then((r) => r.json());
		const fresh = ((search.messages ?? []) as { ID: string; Created: string }[]).filter(
			(m) => Date.parse(m.Created) >= after - 1000
		);
		if (fresh.length > 0) {
			const message = await fetch(`${stack.MAILPIT_URL}/api/v1/message/${fresh[0].ID}`).then((r) =>
				r.json()
			);
			const href = /href="([^"]*\/auth\/confirm\?[^"]+)"/.exec(message.HTML)?.[1];
			if (!href) throw new Error('no /auth/confirm link in the email');
			const url = new URL(href.replaceAll('&amp;', '&'));
			// Email links use the Supabase site URL (the dev server); E2E runs on `vite preview`.
			return url.pathname + url.search;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`no email to ${to}`);
}

export async function accountExists(email: string) {
	const [{ count }] = await sql`
		select count(*)::int from public.users u join auth.users a on a.id = u.auth_id
		where a.email = ${email}
	`;
	return count === 1;
}

/** Makes every session of this account older than the shared-device lifetime. */
export async function ageSessions(email: string) {
	await sql`
		update public.session_policies set created_at = now() - interval '9 hours'
		where user_id = (
			select u.id from public.users u join auth.users a on a.id = u.auth_id where a.email = ${email}
		)
	`;
}

export async function cleanUp() {
	if (madeHere.size === 0) return;
	const ids = await sql`select id from auth.users where email = any(${[...madeHere]})`;
	for (const { id } of ids) await admin.auth.admin.deleteUser(id);
	madeHere.clear();
}

/** The newest email (in the local Mailpit) whose text contains `marker`, or null after ~10 s. */
export async function emailContaining(marker: string) {
	for (let attempt = 0; attempt < 40; attempt++) {
		const search = await fetch(
			`${stack.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`"${marker}"`)}`
		).then((r) => r.json());
		const [found] = (search.messages ?? []) as { ID: string }[];
		if (found) {
			return (await fetch(`${stack.MAILPIT_URL}/api/v1/message/${found.ID}`).then((r) =>
				r.json()
			)) as { Subject: string; Text: string; ReplyTo: { Address: string }[] };
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	return null;
}
