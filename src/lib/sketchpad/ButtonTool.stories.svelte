<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import IconPen from '../components/icons/IconPen.svelte';
	import type { Size } from '../components/icons/sizes.ts';
	import ButtonTool from './ButtonTool.svelte';
	import { PEN_SIZES, TOOL_PEN } from './constants.ts';
	import { toolDrawerOpen } from './stores.ts';
	import type { SecondaryTool } from './types.ts';

	const { Story } = defineMeta({
		title: 'Annotation/Toolbar/ButtonTool',
		component: ButtonTool,
		render: template,
		args: {
			toolName: TOOL_PEN,
			tooltip: 'Annotate',
			onchangeprimary: fn(),
			onchangesecondary: fn()
		},
		argTypes: {
			children: { control: false },
			secondaryTool: { control: false },
			secondaryTools: { control: false }
		},
		globals: { backgrounds: { value: 'canvas' } },
		beforeEach: () => toolDrawerOpen.set(''),
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 240, autoplay: true },
				description: {
					component:
						'A tool in the toolbar, with an optional drawer of options. Pressing a selected tool toggles its drawer.'
				}
			}
		}
	});
</script>

{#snippet size(option: SecondaryTool)}
	<div class="option"><option.component size={option.id as Size} /></div>
{/snippet}

{#snippet template(args: Record<string, unknown>)}
	<ButtonTool toolName={TOOL_PEN} {...args} secondaryTool={size}><IconPen /></ButtonTool>
{/snippet}

<Story name="Not selected" />
<Story name="Selected" args={{ primaryValue: TOOL_PEN }} />
<!-- Opened after mounting: the drawer's content only appears through its intro transition. -->
<Story
	name="Drawer open"
	args={{ primaryValue: TOOL_PEN, secondaryTools: PEN_SIZES, secondaryValue: PEN_SIZES[1].value }}
	play={() => toolDrawerOpen.set(TOOL_PEN)}
/>

<style>
	.option {
		cursor: pointer;
		padding: var(--space-2);
	}
</style>
