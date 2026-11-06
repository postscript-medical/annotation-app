<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { ComponentProps } from 'svelte';
	import { fn } from 'storybook/test';
	import ColorPalette from './ColorPalette.svelte';
	import { PEN_COLORS } from './constants.ts';

	const { Story } = defineMeta({
		title: 'Annotation/Toolbar/ColorPalette',
		component: ColorPalette,
		render: template,
		args: { colors: PEN_COLORS, selected: PEN_COLORS[0].value, tooltip: 'Colors', onchange: fn() },
		argTypes: { colors: { control: false } },
		globals: { backgrounds: { value: 'canvas' } },
		parameters: {
			docs: {
				description: {
					component:
						'The pen colours. These are drawing data (`PEN_COLORS`), saved into annotations and exported images, so they aren’t design tokens.'
				}
			}
		}
	});
</script>

{#snippet template(args: ComponentProps<typeof ColorPalette>)}
	<div style:display="inline-block"><ColorPalette {...args} /></div>
{/snippet}

<Story name="Black selected" />
<Story name="Red selected" args={{ selected: PEN_COLORS[1].value }} />
