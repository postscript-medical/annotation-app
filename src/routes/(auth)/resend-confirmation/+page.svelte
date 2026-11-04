<script lang="ts">
	import EmailRequest from '#lib/components/auth/EmailRequest.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<EmailRequest title="Resend the confirmation email" button="Send it again" {form}>
	{#snippet intro()}
		<p>Signed up but the confirmation link expired or never arrived? Enter your email address.</p>
	{/snippet}
	{#snippet sent(email)}
		<p>
			If <strong>{email}</strong> is waiting to be confirmed, we've sent a new link. It expires in 15
			minutes.
		</p>
	{/snippet}
</EmailRequest>
