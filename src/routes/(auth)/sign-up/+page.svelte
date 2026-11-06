<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthPage from '#lib/components/auth/AuthPage.svelte';
	import Notice from '#lib/components/auth/Notice.svelte';
	import PasswordField from '#lib/components/auth/PasswordField.svelte';
	import TextField from '#lib/components/auth/TextField.svelte';
	import { PRIVACY_URL, TERMS_URL } from '#lib/links.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
	const fieldErrors = $derived(
		form && 'fieldErrors' in form ? (form.fieldErrors as Record<string, string>) : {}
	);
</script>

<AuthPage title={form && 'sent' in form ? 'Check your email' : 'Create an account'}>
	{#if form && 'sent' in form}
		<Notice>
			<p>
				If <strong>{form.email}</strong> can be used for a new account, we've sent a link to confirm it.
				The link expires in 15 minutes.
			</p>
		</Notice>
		<p class="small">
			Nothing arrived? Check your spam folder, or
			<a href={resolve('/(auth)/resend-confirmation')}>send the confirmation email again</a>.
			Already confirmed?
			<a href={resolve('/(auth)')}>Sign in</a>.
		</p>
	{:else}
		{#if form?.error && form.error.code !== 'VALIDATION_FAILED'}
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
				value={form && 'email' in form ? String(form.email ?? '') : ''}
				error={fieldErrors.email}
			/>
			<PasswordField
				label="Password"
				name="password"
				autocomplete="new-password"
				hint="At least 15 characters. Try three random words."
				error={fieldErrors.password}
			/>
			<Button type="submit" style="on-dark" loading={submitting}>Create account</Button>
		</form>
		<p class="small">
			By continuing you agree to the <a href={TERMS_URL} rel="external">Terms of use</a> and the
			<a href={PRIVACY_URL} rel="external">Privacy notice</a>.
		</p>
		<p class="links"><a href={resolve('/(auth)')}>I already have an account</a></p>
	{/if}
</AuthPage>
