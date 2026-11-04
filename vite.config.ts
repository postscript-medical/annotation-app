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
			adapter: adapter(),
			// Content Security Policy (migration-plan Phase 1, S9). Nonces for SvelteKit's own inline
			// scripts and styles; nothing third-party. Security headers are in hooks.server.ts.
			csp: {
				mode: 'nonce',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self'],
					// Inline style attributes (the app.html wrapper, Svelte style: directives); they can't
					// run script.
					'style-src-attr': ['unsafe-inline'],
					// data:/blob: for the canvas compositing and image export (2.x). Illustrations: G7.
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					// No request leaves for another host; nothing uploads images (data-protection §2).
					'connect-src': ['self'],
					'worker-src': ['self'],
					'manifest-src': ['self'],
					'media-src': ['none'],
					'object-src': ['none'],
					'frame-src': ['none'],
					'frame-ancestors': ['none'],
					'base-uri': ['none'],
					'form-action': ['self']
				}
			}
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
