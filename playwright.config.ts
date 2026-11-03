import { defineConfig, devices } from '@playwright/test';

const ci = !!process.env.CI;

export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	reporter: ci ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } }
	],
	webServer: {
		// CI builds in an earlier step; locally, build first so E2E runs against production output.
		command: ci ? 'npm run preview' : 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !ci
	}
});
