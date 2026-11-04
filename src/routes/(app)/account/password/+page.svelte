<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthPage from '#lib/components/auth/AuthPage.svelte';
	import Notice from '#lib/components/auth/Notice.svelte';
	import PasswordField from '#lib/components/auth/PasswordField.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
	const fieldErrors = $derived(
		form && 'fieldErrors' in form ? (form.fieldErrors as Record<string, string>) : {}
	);
</script>

<AuthPage title="Change your password" signedIn>
	{#if form?.error && form.error.code !== 'VALIDATION_FAILED'}
		<Notice tone="error"><p>{form.error.message}</p></Notice>
	{/if}
	<p>This signs you out on every other device. You'll stay signed in here.</p>
	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		<PasswordField
			label="Current password"
			name="currentPassword"
			autocomplete="current-password"
			error={fieldErrors.currentPassword}
		/>
		<PasswordField
			label="New password"
			name="newPassword"
			autocomplete="new-password"
			hint="At least 15 characters. Try three random words."
			error={fieldErrors.newPassword}
		/>
		<Button type="submit" style="on-dark" loading={submitting}>Change password</Button>
	</form>
	<p class="links"><a href={resolve('/(app)/account')}>Back to your account</a></p>
</AuthPage>
