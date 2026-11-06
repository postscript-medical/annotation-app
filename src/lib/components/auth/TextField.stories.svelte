<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { ComponentProps } from 'svelte';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({
		title: 'Components/Forms/TextField',
		component: TextField,
		render: template,
		args: { label: 'Email', name: 'email', type: 'email' },
		globals: { backgrounds: { value: 'brand' } },
		parameters: {
			docs: {
				description: {
					component:
						'A form field for the green pages, with a hint and an error tied to the input for screen readers. Works without JavaScript.'
				}
			}
		}
	});
</script>

{#snippet template(args: ComponentProps<typeof TextField>)}
	<div class="on-brand"><TextField {...args} /></div>
{/snippet}

<Story name="Default" />
<Story name="With value" args={{ value: 'someone@example.com' }} />
<Story name="With hint" args={{ hint: 'We only use this to sign you in.' }} />
<Story name="With error" args={{ error: 'Please enter a valid email address.' }} />

<style>
	/* AuthPage sets this for the real pages. */
	.on-brand {
		color: var(--color-white);
	}
</style>
