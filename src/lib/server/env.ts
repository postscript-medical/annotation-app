import {
	RATE_LIMIT_HMAC_SECRET,
	SUPABASE_PUBLISHABLE_KEY,
	SUPABASE_SECRET_KEY,
	SUPABASE_URL
} from '$app/env/private';

/**
 * Server configuration, declared and validated in src/env.ts. Every variable may be unset at
 * startup (so the build and unit tests need no secrets); this throws when code needs one that
 * is missing.
 */
const values = {
	SUPABASE_URL,
	SUPABASE_PUBLISHABLE_KEY,
	SUPABASE_SECRET_KEY,
	RATE_LIMIT_HMAC_SECRET
};

export type ServerEnvName = keyof typeof values;

/** Raised when a variable is missing. The name is logged server-side, never sent to a client. */
export class ConfigurationError extends Error {
	constructor(name: ServerEnvName) {
		super(`Environment variable ${name} is not set`);
		this.name = 'ConfigurationError';
	}
}

export function serverEnv(name: ServerEnvName): string {
	const value = values[name];
	if (!value) throw new ConfigurationError(name);
	return value;
}
