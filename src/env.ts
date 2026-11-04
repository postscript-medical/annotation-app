import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Environment variables (SvelteKit 3: imported from `$app/env/private`).
 *
 * All are private and read when the server starts, so the build needs no secrets. Each may be
 * unset here so that the build, unit tests and type generation run without them; the server
 * code that needs one calls `serverEnv()` (#lib/server/env), which throws if it is missing.
 * A value that is set but malformed fails at startup.
 *
 * Local values: `npx supabase status` (see .env.example). Netlify: site environment variables.
 */
const optional =
	(check?: (value: string) => string | void) =>
	(value: string | undefined): string | undefined => {
		if (value === undefined || value === '') return undefined;
		const problem = check?.(value);
		if (problem) throw new Error(problem);
		return value;
	};

export const variables = defineEnvVars({
	SUPABASE_URL: {
		description: 'Supabase project URL (API).',
		schema: optional((value) => {
			try {
				new URL(value);
			} catch {
				return 'SUPABASE_URL must be a URL';
			}
		})
	},
	SUPABASE_PUBLISHABLE_KEY: {
		description: 'Supabase publishable key, used server-side only for the per-request SSR client.',
		schema: optional()
	},
	SUPABASE_SECRET_KEY: {
		description: 'Supabase secret key. Bypasses RLS; server only.',
		schema: optional()
	},
	RATE_LIMIT_HMAC_SECRET: {
		description: 'HMAC key for rate-limit keys (at least 32 random characters).',
		schema: optional((value) =>
			value.length < 32 ? 'RATE_LIMIT_HMAC_SECRET must be at least 32 characters' : undefined
		)
	}
});
