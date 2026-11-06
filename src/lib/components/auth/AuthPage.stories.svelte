<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from '../Button.svelte';
	import AuthPage from './AuthPage.svelte';
	import PasswordField from './PasswordField.svelte';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({
		title: 'Layouts/AuthPage',
		component: AuthPage,
		render: template,
		args: { title: 'Sign in' },
		globals: { backgrounds: { value: 'brand' } },
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component: 'The frame for the sign-in, sign-up, password, account and error pages.'
				}
			}
		}
	});
</script>

{#snippet template(args: { title: string; signedIn?: boolean })}
	<AuthPage {...args}>
		<form onsubmit={(event) => event.preventDefault()}>
			<TextField label="Email" name="email" type="email" autocomplete="username" required />
			<PasswordField label="Password" name="password" autocomplete="current-password" />
			<Button type="submit" style="on-dark">Sign in</Button>
		</form>
		<p class="links">
			<a href="#forgot">Forgot password?</a> <a href="#sign-up">Create an account</a>
		</p>
	</AuthPage>
{/snippet}

<Story name="Sign-in form" />
