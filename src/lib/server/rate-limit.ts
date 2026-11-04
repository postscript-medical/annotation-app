import { createHmac } from 'node:crypto';
import { isIPv4, isIPv6 } from 'node:net';
import { serverEnv } from './env';
import { adminClient, type Db } from './supabase';

/**
 * Postgres-backed rate limits (auth-spec §6; data-model §3.4).
 *
 * Keys are `scope:kind:HMAC-SHA256(secret, scope:kind:subject)`. The subject is a lower-cased
 * email, the client IP's /24 (IPv4) or /48 (IPv6) prefix, or a user id, and never reaches the
 * database. Counters are fixed windows (rate_limit_hit / rate_limit_count) and are purged after
 * 24 hours.
 */
export type RateLimitRule = {
	scope: string;
	kind: 'email' | 'ip' | 'user';
	limit: number;
	windowSeconds: number;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;

/** Auth-spec §6. Constants, to be tuned after launch. */
export const RATE_LIMITS = {
	signInEmail: { scope: 'signin', kind: 'email', limit: 5, windowSeconds: 15 * MINUTE },
	signInIp: { scope: 'signin', kind: 'ip', limit: 20, windowSeconds: 15 * MINUTE },
	signUpIp: { scope: 'signup', kind: 'ip', limit: 5, windowSeconds: HOUR },
	resetEmail: { scope: 'reset', kind: 'email', limit: 3, windowSeconds: HOUR },
	resetIp: { scope: 'reset', kind: 'ip', limit: 10, windowSeconds: HOUR },
	resendEmail: { scope: 'resend', kind: 'email', limit: 3, windowSeconds: HOUR },
	resendIp: { scope: 'resend', kind: 'ip', limit: 10, windowSeconds: HOUR },
	confirmIp: { scope: 'confirm', kind: 'ip', limit: 20, windowSeconds: 15 * MINUTE },
	feedbackUser: { scope: 'feedback', kind: 'user', limit: 5, windowSeconds: 24 * HOUR }
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

/** Expands an IPv6 address to its eight 16-bit groups (handles `::` and an IPv4 tail). */
function ipv6Groups(address: string): number[] {
	let text = address;
	const v4Tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
	if (v4Tail) {
		const [a, b, c, d] = v4Tail[1].split('.').map(Number);
		text =
			text.slice(0, -v4Tail[1].length) +
			`${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
	}
	const [head, tail] = text.split('::');
	const parse = (part: string | undefined) =>
		part ? part.split(':').map((group) => parseInt(group, 16)) : [];
	const left = parse(head);
	const right = parse(tail);
	const missing = tail === undefined ? 0 : 8 - left.length - right.length;
	return [...left, ...Array<number>(missing).fill(0), ...right];
}

/**
 * The network prefix rate limits use: `a.b.c.0/24` for IPv4 (including IPv4-mapped IPv6) and
 * `x:y:z::/48` for IPv6. Anything unparseable shares one `unknown` bucket.
 */
export function ipPrefix(ip: string): string {
	let address = ip.trim().split('%')[0];
	const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
	if (mapped) address = mapped[1];
	if (isIPv4(address)) {
		const [a, b, c] = address.split('.').map(Number);
		return `${a}.${b}.${c}.0/24`;
	}
	if (isIPv6(address)) {
		const groups = ipv6Groups(address.toLowerCase());
		return `${groups
			.slice(0, 3)
			.map((group) => group.toString(16))
			.join(':')}::/48`;
	}
	return 'unknown';
}

function subjectFor(rule: RateLimitRule, value: string): string {
	if (rule.kind === 'ip') return ipPrefix(value);
	if (rule.kind === 'email') return value.trim().toLowerCase();
	return value;
}

/** The stored key for a rule and a raw subject (email, IP or user id). */
export function rateLimitKey(secret: string, rule: RateLimitRule, value: string): string {
	const label = `${rule.scope}:${rule.kind}`;
	const mac = createHmac('sha256', secret)
		.update(`${label}:${subjectFor(rule, value)}`)
		.digest('base64url');
	return `${label}:${mac}`;
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

export function createRateLimiter(db: Db, secret: string) {
	async function count(name: RateLimitName, value: string): Promise<number> {
		const rule = RATE_LIMITS[name];
		const { data, error } = await db.rpc('rate_limit_count', {
			p_key: rateLimitKey(secret, rule, value),
			p_window_seconds: rule.windowSeconds
		});
		if (error || data === null) throw new Error('rate_limit_count failed', { cause: error });
		return data;
	}

	async function hit(name: RateLimitName, value: string): Promise<number> {
		const rule = RATE_LIMITS[name];
		const { data, error } = await db.rpc('rate_limit_hit', {
			p_key: rateLimitKey(secret, rule, value),
			p_window_seconds: rule.windowSeconds
		});
		if (error || data === null) throw new Error('rate_limit_hit failed', { cause: error });
		return data;
	}

	return {
		count,
		hit,
		/** Already at the limit? Doesn't count this attempt (for "count failures only" rules). */
		async isLimited(name: RateLimitName, value: string): Promise<boolean> {
			return (await count(name, value)) >= RATE_LIMITS[name].limit;
		},
		/** Counts this attempt; false once it goes over the limit. */
		async consume(name: RateLimitName, value: string): Promise<boolean> {
			return (await hit(name, value)) <= RATE_LIMITS[name].limit;
		}
	};
}

/** The app's limiter: secret-key client and `RATE_LIMIT_HMAC_SECRET`. */
export function rateLimiter(): RateLimiter {
	return createRateLimiter(adminClient(), serverEnv('RATE_LIMIT_HMAC_SECRET'));
}
