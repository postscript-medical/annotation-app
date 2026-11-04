import type { Database } from '../types/db';
import type { Db } from './supabase';

/**
 * Session policy (auth-spec §5). The Supabase free tier has no session time-box, so the app
 * enforces lifetime and idle limits itself, keyed by the JWT `session_id`.
 */
export type SessionMode = Database['public']['Enums']['session_mode'];
export type WorkspaceRole = Database['public']['Enums']['workspace_role'];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SESSION_RULES: Record<SessionMode, { lifetimeMs: number; idleMs: number }> = {
	personal: { lifetimeMs: 30 * DAY, idleMs: 7 * DAY },
	shared: { lifetimeMs: 8 * HOUR, idleMs: 60 * MINUTE }
};

/** `last_seen_at` is written at most this often per session. */
export const LAST_SEEN_INTERVAL_MS = 5 * MINUTE;

export type PolicyTimes = { mode: SessionMode; created_at: string; last_seen_at: string };

/**
 * `expired`: past the absolute lifetime or the idle limit. `touch`: valid, and `last_seen_at`
 * is old enough to write again. `ok`: valid, nothing to write.
 */
export function evaluateSession(policy: PolicyTimes, now: Date): 'expired' | 'touch' | 'ok' {
	const rules = SESSION_RULES[policy.mode];
	const age = now.getTime() - Date.parse(policy.created_at);
	const idle = now.getTime() - Date.parse(policy.last_seen_at);
	if (!(age < rules.lifetimeMs) || !(idle < rules.idleMs)) return 'expired';
	return idle >= LAST_SEEN_INTERVAL_MS ? 'touch' : 'ok';
}

/** The `amr` claim as a list of method names (Supabase sends objects or strings). */
export function amrMethods(amr: unknown): string[] {
	if (!Array.isArray(amr)) return [];
	return amr
		.map((entry) =>
			typeof entry === 'string'
				? entry
				: typeof entry === 'object' && entry !== null && 'method' in entry
					? String((entry as { method: unknown }).method)
					: ''
		)
		.filter(Boolean);
}

export type SessionRecord = {
	mode: SessionMode;
	createdAt: string;
	lastSeenAt: string;
	recoveryVerifiedAt: string | null;
	userId: string;
	authId: string;
	membership: { workspaceId: string; role: WorkspaceRole } | null;
};

/**
 * The session's policy row, its user and the active membership, in one query (auth-spec §3.2).
 * At launch a user has one membership; with several, the most recent wins (data-model §6.2).
 */
export async function loadSession(admin: Db, sessionId: string): Promise<SessionRecord | null> {
	const { data, error } = await admin
		.from('session_policies')
		.select(
			'mode, created_at, last_seen_at, recovery_verified_at, user:users!inner(id, auth_id, memberships:workspace_members(workspace_id, role, created_at))'
		)
		.eq('session_id', sessionId)
		.maybeSingle();
	if (error) throw new Error('session lookup failed', { cause: error });
	if (!data) return null;

	const latest = [...data.user.memberships].sort((a, b) =>
		b.created_at.localeCompare(a.created_at)
	)[0];
	return {
		mode: data.mode,
		createdAt: data.created_at,
		lastSeenAt: data.last_seen_at,
		recoveryVerifiedAt: data.recovery_verified_at,
		userId: data.user.id,
		authId: data.user.auth_id,
		membership: latest ? { workspaceId: latest.workspace_id, role: latest.role } : null
	};
}

/** Creates the account if needed (ensure_account) and returns the active membership. */
export async function ensureMembership(
	admin: Db,
	authId: string
): Promise<{ userId: string; workspaceId: string; role: WorkspaceRole }> {
	const { data: user, error } = await admin.rpc('ensure_account', { p_auth_id: authId });
	if (error || !user) throw new Error('ensure_account failed', { cause: error });
	const { data: memberships, error: membershipError } = await admin
		.from('workspace_members')
		.select('workspace_id, role')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(1);
	const latest = memberships?.[0];
	if (membershipError || !latest) {
		throw new Error('membership lookup failed', { cause: membershipError });
	}
	return { userId: user.id, workspaceId: latest.workspace_id, role: latest.role };
}

export async function touchSession(admin: Db, sessionId: string, now: Date): Promise<void> {
	const { error } = await admin
		.from('session_policies')
		.update({ last_seen_at: now.toISOString() })
		.eq('session_id', sessionId);
	if (error) throw new Error('last_seen_at update failed', { cause: error });
}

export async function deleteSessionPolicy(admin: Db, sessionId: string): Promise<void> {
	const { error } = await admin.from('session_policies').delete().eq('session_id', sessionId);
	if (error) throw new Error('session policy delete failed', { cause: error });
}
