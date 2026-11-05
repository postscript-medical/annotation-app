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
	},
	// Feedback email (2.6): Lettermint SMTP on Netlify, the local Mailpit in development.
	SMTP_HOST: {
		description: 'SMTP host: smtp.lettermint.co (Netlify) or 127.0.0.1 (local Mailpit).',
		schema: optional()
	},
	SMTP_PORT: {
		description: 'SMTP port: 587 with STARTTLS (Lettermint) or 54325 (local Mailpit).',
		schema: optional((value) =>
			/^\d{1,5}$/.test(value) && Number(value) > 0 && Number(value) < 65536
				? undefined
				: 'SMTP_PORT must be a port number'
		)
	},
	SMTP_USER: {
		description: 'SMTP username ("lettermint"); unset for the local Mailpit.',
		schema: optional()
	},
	SMTP_PASSWORD: {
		description: 'SMTP password: a Lettermint project API token (lm_…); unset locally.',
		schema: optional()
	},
	FEEDBACK_TO: {
		description: 'Where feedback is sent (staff inbox).',
		schema: optional((value) =>
			/^[^\s@]+@[^\s@]+$/.test(value) ? undefined : 'FEEDBACK_TO must be an email address'
		)
	}
});
