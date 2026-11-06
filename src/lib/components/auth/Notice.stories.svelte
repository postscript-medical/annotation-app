<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { ComponentProps } from 'svelte';
	import Notice from './Notice.svelte';

	const { Story } = defineMeta({
		title: 'Components/Feedback/Notice',
		component: Notice,
		render: template,
		globals: { backgrounds: { value: 'brand' } },
		argTypes: {
			tone: { control: 'inline-radio', options: ['info', 'error'] }
		},
		parameters: {
			docs: {
				description: {
					component:
						'A message on the green pages. An `error` is announced at once, `info` politely.'
				}
			}
		}
	});
</script>

{#snippet template(args: Omit<ComponentProps<typeof Notice>, 'children'>)}
	<div class="on-brand">
		<Notice {...args}><p>Check your email for a link to continue.</p></Notice>
	</div>
{/snippet}

<Story name="Information" />
<Story name="Error" args={{ tone: 'error' }} />

<style>
	/* AuthPage sets this for the real pages. */
	.on-brand {
		color: var(--color-white);
	}
</style>
