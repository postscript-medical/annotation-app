<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import IconPen from '../components/icons/IconPen.svelte';
	import ButtonIcon from './ButtonIcon.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Toolbar/ButtonIcon',
		component: ButtonIcon,
		render: template,
		args: { onclick: fn() },
		argTypes: { children: { control: false } },
		globals: { backgrounds: { value: 'canvas' } },
		parameters: {
			docs: {
				description: {
					component: 'The round toolbar button. `onDark` marks the selected tool.'
				}
			}
		}
	});
</script>

{#snippet template(args: Record<string, unknown>)}
	<ButtonIcon {...args}><IconPen /></ButtonIcon>
{/snippet}

<Story name="Default" />
<Story name="Selected" args={{ onDark: true }} />
