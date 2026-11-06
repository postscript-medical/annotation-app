import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/sveltekit';

const appPaths = fileURLToPath(new URL('./mocks/app-paths.ts', import.meta.url));

const config: StorybookConfig = {
	framework: '@storybook/sveltekit',
	stories: ['../src/**/*.mdx', '../src/**/*.stories.svelte'],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs', '@storybook/addon-a11y'],
	// The app's fonts and background, plus placeholder illustrations: the real ones are proxied from
	// Cloudinary by /images/[...path], which doesn't exist here.
	staticDirs: ['../static', './public'],
	core: { disableTelemetry: true },
	viteFinal: (config) => ({
		...config,
		plugins: [
			...(config.plugins ?? []),
			// The framework mocks $app/forms, navigation, state and stores, but not SvelteKit 3's
			// $app/paths, whose real module needs the app's runtime payload. As a plugin at the end,
			// like the framework's mocks: a later plugin's alias goes before SvelteKit's $app alias.
			{
				name: 'storybook:mock-app-paths',
				config: () => ({ resolve: { alias: { '$app/paths': appPaths } } })
			}
		]
	})
};

export default config;
