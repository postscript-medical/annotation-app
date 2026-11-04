<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Tooltip from './Tooltip.svelte';
	import IconClose from './icons/IconClose.svelte';

	// The app's modal (legacy Modal.svelte; the unused PsModal draft is merged away). A native
	// <dialog> opened with showModal(): focus moves into it and stays there, the page behind is
	// inert, and Escape closes it like Cancel. Render it to open it; `onclose` should un-render it.
	// The content sits in a form: Confirm (or Enter) calls `onconfirm`.
	type Props = {
		header: Snippet;
		children?: Snippet;
		footer?: Snippet;
		cancelLabel?: string;
		confirmLabel?: string;
		disableConfirmButton?: boolean;
		hideCancelButton?: boolean;
		hideCloseButton?: boolean;
		hideConfirmButton?: boolean;
		loading?: boolean;
		size?: 'normal' | 'extend';
		onclose?: () => void;
		onconfirm?: () => void;
		ontweenoutcomplete?: () => void;
	};

	let {
		header,
		children,
		footer,
		cancelLabel = 'Cancel',
		confirmLabel = 'Confirm',
		disableConfirmButton = false,
		hideCancelButton = false,
		hideCloseButton = false,
		hideConfirmButton = false,
		loading = false,
		size = 'normal',
		onclose,
		onconfirm,
		ontweenoutcomplete
	}: Props = $props();

	const titleId = $props.id();
	let dialog: HTMLDialogElement | undefined = $state();
	let tooltip = $state<{ x: number; y: number } | null>(null);

	$effect(() => {
		dialog?.showModal();
		return () => dialog?.close();
	});

	function cancel(event?: Event) {
		// Escape fires `cancel`; keep the dialog open and let the parent decide.
		event?.preventDefault();
		tooltip = null;
		onclose?.();
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		onconfirm?.();
	}

	function showTooltip(event: PointerEvent) {
		const { left, top, width, height } = (
			event.currentTarget as HTMLElement
		).getBoundingClientRect();
		tooltip = { x: left + width, y: top + height * 0.5 };
	}
</script>

<dialog
	bind:this={dialog}
	class="modal shadow {size}"
	aria-labelledby={titleId}
	oncancel={cancel}
	onclick={(event) => event.target === dialog && cancel()}
>
	<form method="dialog" onsubmit={submit}>
		<h2 class="modal-header">
			<span id={titleId}>{@render header()}</span>
			{#if !hideCloseButton}
				<button
					class="close"
					type="button"
					aria-label="Close"
					onclick={() => cancel()}
					onpointerenter={showTooltip}
					onpointerleave={() => (tooltip = null)}
				>
					<IconClose />
				</button>
				{#if tooltip}
					<Tooltip x={tooltip.x} y={tooltip.y}>Close</Tooltip>
				{/if}
			{/if}
		</h2>
		<div class="content">{@render children?.()}</div>
		<footer>
			{@render footer?.()}
			{#if !hideCancelButton}
				<Button style="secondary" disabled={loading} onclick={() => cancel()}>
					{cancelLabel}
				</Button>
			{/if}
			{#if !hideConfirmButton}
				<Button type="submit" disabled={disableConfirmButton} {loading} {ontweenoutcomplete}>
					{confirmLabel}
				</Button>
			{/if}
		</footer>
	</form>
</dialog>

<style>
	dialog {
		background-color: white;
		border: 0;
		border-radius: 1rem;
		color: rgb(42, 41, 41);
		max-height: 90%;
		overflow: hidden;
		padding: 2rem;
		width: 95%;
	}

	dialog::backdrop {
		background-color: rgba(255, 255, 255, 0.96);
	}

	form {
		display: grid;
		gap: 1rem;
		grid-template-rows: min-content 1fr min-content;
		height: 100%;
		overflow: hidden;
	}

	/* Negate the global form spacing. */
	form > :global(:not(:last-child)) {
		margin-bottom: 0;
	}

	.modal-header {
		align-items: start;
		display: grid;
		gap: 0.5rem;
		grid-template-columns: 1fr min-content;
		margin: 0;
	}

	.close {
		background: transparent;
		border: 0;
		padding: 0;
	}

	.content {
		overflow: auto;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		justify-content: flex-end;
	}

	.extend {
		height: 90%;
	}

	@media screen and (min-width: 600px) {
		dialog {
			min-width: 30rem;
		}

		.normal {
			max-width: 50ch;
		}

		.extend {
			width: 90%;
			max-width: 1920px;
		}
	}

	@media print {
		dialog {
			display: none;
		}
	}
</style>
