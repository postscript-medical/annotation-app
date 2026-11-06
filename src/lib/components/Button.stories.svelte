<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		title: 'Components/Actions/Button',
		component: Button,
		render: template,
		args: { onclick: fn() },
		argTypes: {
			style: {
				control: 'select',
				options: [
					'primary',
					'secondary',
					'tertiary',
					'danger',
					'on-dark',
					'inline',
					'inline on-dark'
				]
			},
			children: { control: false }
		},
		parameters: {
			docs: {
				description: {
					component:
						'The one button for actions. Use a single primary per view, `secondary` beside it, `danger` only for something that deletes, `inline` where it sits in a sentence, and `on-dark` on the green pages. While `loading`, the label becomes a spinning dot and the button is disabled.'
				}
			}
		}
	});
</script>

{#snippet template(args: Record<string, unknown>)}
	<Button {...args}>Save changes</Button>
{/snippet}

<Story name="Primary" />
<Story name="Secondary" args={{ style: 'secondary' }} />
<Story
	name="Tertiary"
	args={{ style: 'tertiary' }}
	parameters={{ docs: { description: { story: 'The header actions on the annotation screen.' } } }}
/>
<Story name="Danger" args={{ style: 'danger' }} />
<Story name="On dark" args={{ style: 'on-dark' }} globals={{ backgrounds: { value: 'brand' } }} />
<Story name="Inline" args={{ style: 'inline' }} />
<Story
	name="Inline on dark"
	args={{ style: 'inline on-dark' }}
	globals={{ backgrounds: { value: 'brand' } }}
/>
<Story name="Disabled" args={{ disabled: true }} />
<Story name="Loading" args={{ loading: true }} />
