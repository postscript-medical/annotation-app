<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '#lib/components/Button.svelte';
	import ErrorMessage from '#lib/components/ErrorMessage.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import { canShareFiles, downloadBlob, shareOrDownload } from '#lib/share/share.ts';

	// Share the annotated image (legacy ShareModal without its email tab: sharing is device-only,
	// data-protection §2). The JPEG is prepared as the modal opens, so the Share button can hand
	// it to the system share sheet straight from the tap (browsers, Safari above all, refuse
	// `navigator.share` once the tap's user activation has been spent on awaiting other work).
	let {
		prepare,
		onprint,
		onclose
	}: {
		/** Flattens the canvas into the JPEG to share. */
		prepare: () => Promise<Blob>;
		onprint: () => void;
		onclose: () => void;
	} = $props();

	let image = $state<Blob | null>(null);
	let error = $state<string | null>(null);
	let status = $state<string | null>(null);
	const shareable = canShareFiles();

	onMount(() => {
		prepare().then(
			(blob) => (image = blob),
			() => (error = "We couldn't prepare the image. Please close this window and try again.")
		);
	});

	async function share() {
		if (!image) return;
		status = null;
		const outcome = await shareOrDownload(image);
		if (outcome === 'downloaded') {
			status = "Sharing isn't available here, so the image was downloaded.";
		}
	}

	function download() {
		if (!image) return;
		downloadBlob(image);
		status = 'The image has been downloaded.';
	}
</script>

<Modal hideCancelButton hideConfirmButton {onclose}>
	{#snippet header()}Share the annotated image{/snippet}

	<ErrorMessage message={error} />

	<div class="modal-body" aria-busy={!image && !error}>
		{#if !image && !error}
			<p>Preparing the image…</p>
		{/if}

		{#if shareable}
			<h3>Share from this device</h3>
			<p>Send it with your device's own apps, such as Messages or Mail.</p>
			<Button disabled={!image} onclick={share}>Share image</Button>
			<hr />
		{/if}

		<h3>Save the image locally</h3>
		<Button style="secondary" disabled={!image} onclick={download}>Download image</Button>
		<hr />
		<h3>Send to your printer</h3>
		<Button style="secondary" onclick={onprint}>Print image</Button>

		{#if status}
			<p role="status">{status}</p>
		{/if}
	</div>
</Modal>

<style>
	hr {
		opacity: 20%;
		width: 90%;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
	}

	.modal-body > :global(*) {
		align-self: flex-start;
		margin-bottom: 1rem;
	}

	h3,
	p {
		margin-top: 0;
	}
</style>
