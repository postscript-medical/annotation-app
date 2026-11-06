<script lang="ts">
	import Button from '../Button.svelte';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import AuthPage from './AuthPage.svelte';
	import Notice from './Notice.svelte';
	import TextField from './TextField.svelte';

	// The email-only request pages (forgot password, resend confirmation). The answer after
	// sending is the same whether or not an account exists.
	type Props = {
		title: string;
		button: string;
		form: { sent?: boolean; email?: string; fieldErrors?: Record<string, string> } | null;
		intro: Snippet;
		sent: Snippet<[string]>;
	};

	let { title, button, form, intro, sent }: Props = $props();
	let submitting = $state(false);
</script>

<AuthPage title={form?.sent ? 'Check your email' : title}>
	{#if form?.sent}
		<Notice>{@render sent(form.email ?? '')}</Notice>
		<p class="links"><a href={resolve('/(auth)')}>Back to sign in</a></p>
	{:else}
		{@render intro()}
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
				error={form?.fieldErrors?.email}
			/>
			<Button type="submit" style="on-dark" loading={submitting}>{button}</Button>
		</form>
		<p class="links"><a href={resolve('/(auth)')}>Back to sign in</a></p>
	{/if}
</AuthPage>
