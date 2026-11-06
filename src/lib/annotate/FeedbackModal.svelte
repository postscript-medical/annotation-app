<script lang="ts">
	import ErrorMessage from '#lib/components/ErrorMessage.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import { FEEDBACK_MAX_LENGTH } from '#lib/feedback.ts';
	import { sendFeedback } from './post-action.ts';

	// Feedback or a bug report to staff (legacy FeedbackModal). Sent by email through `?/feedback`
	// with the account email as reply-to; nothing else about the user goes with it (legacy also
	// sent the name and organisation, which no longer exist).
	let { onclose }: { onclose: () => void } = $props();

	let message = $state('');
	let sending = $state(false);
	let sent = $state(false);
	let error = $state<string | null>(null);

	const empty = $derived(message.trim().length === 0);

	async function send() {
		if (empty || sending) return;
		sending = true;
		error = null;
		const outcome = await sendFeedback(message);
		sending = false;
		if (outcome.kind === 'sent') sent = true;
		else if (outcome.kind !== 'redirected') error = outcome.message;
	}
</script>

<Modal
	confirmLabel="Send"
	cancelLabel="Close"
	disableConfirmButton={empty || sending}
	loading={sending}
	hideConfirmButton={sent}
	{onclose}
	onconfirm={send}
>
	{#snippet header()}
		{#if sent}Thank you.{:else}Have some feedback or would like to report a bug?{/if}
	{/snippet}

	{#if sent}
		<p role="status">
			Your message has been sent. We'll reply to your account email if we need to.
		</p>
	{:else}
		<label for="feedback-message">Your message</label>
		<textarea
			id="feedback-message"
			name="message"
			rows="6"
			maxlength={FEEDBACK_MAX_LENGTH}
			required
			bind:value={message}
			oninput={() => (error = null)}></textarea>
		<p class="hint">
			Please don't include patient details. Up to {FEEDBACK_MAX_LENGTH.toLocaleString('en')} characters.
		</p>
		<ErrorMessage message={error} />
	{/if}
</Modal>

<style>
	label {
		display: block;
		font-weight: var(--font-weight-semibold);
		margin-bottom: var(--space-1);
	}

	textarea {
		box-sizing: border-box;
		font: inherit;
		resize: vertical;
		width: 100%;
	}

	.hint {
		font-size: var(--font-size-md);
		margin: var(--space-1) 0 var(--space-3);
		opacity: 0.8;
	}
</style>
