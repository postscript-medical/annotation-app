<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Tooltip from './Tooltip.svelte';

	const { Story } = defineMeta({
		title: 'Components/Feedback/Tooltip',
		component: Tooltip,
		render: template,
		args: { x: 40, y: 40 },
		argTypes: { children: { control: false } },
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 120 },
				description: {
					component:
						'A small label next to a viewport point. Fixed in the viewport, so clipping containers can’t cut it off, and nudged back inside the window if it would overflow.'
				}
			}
		}
	});
</script>

{#snippet template(args: Record<string, unknown>)}
	<Tooltip {...args}>Undo action</Tooltip>
{/snippet}

<Story name="Default" globals={{ backgrounds: { value: 'canvas' } }} />
