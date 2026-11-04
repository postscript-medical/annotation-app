<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthPage from '#lib/components/auth/AuthPage.svelte';
	import Notice from '#lib/components/auth/Notice.svelte';
	import PasswordField from '#lib/components/auth/PasswordField.svelte';
	import TextField from '#lib/components/auth/TextField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<AuthPage title="Sign in">
	{#if data.expired && !form}
		<Notice><p>Your session has ended. Please sign in again.</p></Notice>
	{/if}
	{#if data.deleted && !form}
		<Notice><p>Your account has been deleted.</p></Notice>
	{/if}
	{#if form?.error}
		<Notice tone="error"><p>{form.error.message}</p></Notice>
	{/if}

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
		<TextField
			label="Email"
			name="email"
			type="email"
			autocomplete="username"
			required
			value={form?.email ?? ''}
		/>
		<PasswordField label="Password" name="password" autocomplete="current-password" />
		<label class="checkbox">
			<input type="checkbox" name="shared" checked />
			<span>
				This is a shared device
				<span class="small">(signs you out after 60 minutes idle or 8 hours)</span>
			</span>
		</label>
		{#if data.next}<input type="hidden" name="next" value={data.next} />{/if}
		<button type="submit" disabled={submitting}>Sign in</button>
	</form>

	<p class="links">
		<a href={resolve('/(auth)/forgot-password')}>Forgot your password?</a>
		<a href={resolve('/(auth)/resend-confirmation')}>Resend the confirmation email</a>
		<a href={resolve('/(auth)/sign-up')}>Create an account</a>
	</p>
</AuthPage>

<style>
	.checkbox {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}
</style>
