import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				// Fast, isolated tests next to the code they cover. No network, no database.
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				// Tests against the local Supabase stack (`npx supabase start`).
				extends: './vite.config.ts',
				test: {
					name: 'integration',
					environment: 'node',
					include: ['tests/integration/**/*.test.ts'],
					globalSetup: ['tests/integration/global-setup.ts'],
					fileParallelism: false,
					testTimeout: 15_000
				}
			}
		]
	}
});
