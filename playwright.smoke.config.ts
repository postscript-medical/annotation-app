import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// The smoke suite (execution plan, open issue 3): what only a deployed site can show. By hand, after
// updating the `staging` branch and in the rehearsal (3.6): `npm run test:smoke`.
// The full suite stays on the local stack, because it needs direct database access and Mailpit.

if (existsSync('.env.smoke')) process.loadEnvFile('.env.smoke');

const baseURL = process.env.SMOKE_BASE_URL ?? 'https://staging.app.postscriptmedical.com';

// Never production. localhost is for checking the suite itself against `vite preview`.
const allowed = ['staging.app.postscriptmedical.com', 'localhost', '127.0.0.1'];
const { hostname } = new URL(baseURL);
if (!allowed.includes(hostname)) {
	throw new Error(`The smoke suite refuses to run against ${hostname}.`);
}

// Say so rather than quietly skip the half that signs in.
const signedOutOnly = process.env.SMOKE_SIGNED_OUT_ONLY === '1';
if (!signedOutOnly && !(process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD)) {
	throw new Error(
		'Set SMOKE_EMAIL and SMOKE_PASSWORD (a dedicated test account, in .env.smoke), or SMOKE_SIGNED_OUT_ONLY=1.'
	);
}

export default defineConfig({
	testDir: 'tests/smoke',
	testMatch: '**/*.smoke.ts',
	testIgnore: signedOutOnly ? '**/signed-in.smoke.ts' : undefined,
	outputDir: 'test-results/smoke',
	// One at a time: the account is shared, and Supabase's per-IP limits apply to the whole site.
	workers: 1,
	reporter: 'list',
	use: { baseURL, trace: 'retain-on-failure' },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'ipad', use: { ...devices['iPad (gen 7)'] } }
	]
});
