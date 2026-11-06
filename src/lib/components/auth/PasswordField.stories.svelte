<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { ComponentProps } from 'svelte';
	import PasswordField from './PasswordField.svelte';

	const { Story } = defineMeta({
		title: 'Components/Forms/PasswordField',
		component: PasswordField,
		render: template,
		args: { label: 'Password', name: 'password', autocomplete: 'current-password' },
		globals: { backgrounds: { value: 'brand' } },
		parameters: {
			docs: {
				description: {
					component:
						'A password input with a show/hide toggle. Paste is allowed and it works with password managers. Without JavaScript it is a plain password field.'
				}
			}
		}
	});
</script>

{#snippet template(args: ComponentProps<typeof PasswordField>)}
	<div class="on-brand"><PasswordField {...args} /></div>
{/snippet}

<Story name="Sign in" />
<Story
	name="New password"
	args={{
		label: 'New password',
		autocomplete: 'new-password',
		hint: 'At least 15 characters. Three random words work well.'
	}}
/>
<Story name="With error" args={{ error: 'That password is too common.' }} />

<style>
	/* AuthPage sets this for the real pages. */
	.on-brand {
		color: var(--color-white);
	}
</style>
