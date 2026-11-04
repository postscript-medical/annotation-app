<script lang="ts">
	import EmailRequest from '#lib/components/auth/EmailRequest.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<EmailRequest title="Forgot your password?" button="Send me a link" {form}>
	{#snippet intro()}
		<p>
			Enter the email address you use for PostScript and we'll send you a link to set a new
			password.
		</p>
	{/snippet}
	{#snippet sent(email)}
		<p>
			If an account exists for <strong>{email}</strong>, we've sent a link to set a new password. It
			expires in 15 minutes. If it doesn't arrive, check your spam folder.
		</p>
	{/snippet}
</EmailRequest>
