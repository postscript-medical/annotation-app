<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthPage from '#lib/components/auth/AuthPage.svelte';
	import Notice from '#lib/components/auth/Notice.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
	const recovery = $derived(data.valid && data.type === 'recovery');
</script>

<AuthPage title={recovery ? 'Set a new password' : 'Confirm your account'}>
	{#if !data.valid || form?.error?.code === 'LINK_INVALID'}
		<Notice tone="error">
			<p>This link has expired or has already been used.</p>
		</Notice>
		<p class="links">
			<a href={resolve('/(auth)/forgot-password')}>Ask for a new password link</a>
			<a href={resolve('/(auth)/resend-confirmation')}>Resend the confirmation email</a>
			<a href={resolve('/(auth)/sign-in')}>Sign in</a>
		</p>
	{:else}
		{#if form?.error}
			<Notice tone="error"><p>{form.error.message}</p></Notice>
		{/if}
		<p>
			{recovery
				? 'Continue to choose a new password for your account.'
				: 'Continue to confirm your email address and sign in.'}
		</p>
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
			<input type="hidden" name="token_hash" value={data.tokenHash} />
			<input type="hidden" name="type" value={data.type} />
			<label class="checkbox">
				<input type="checkbox" name="shared" checked />
				<span>
					This is a shared device
					<span class="small">(signs you out after 60 minutes idle or 8 hours)</span>
				</span>
			</label>
			<Button type="submit" style="on-dark" loading={submitting}>Continue</Button>
		</form>
	{/if}
</AuthPage>

<style>
	.checkbox {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}
</style>
