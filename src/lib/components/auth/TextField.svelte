<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		label: string;
		name: string;
		error?: string;
		hint?: string;
	} & Omit<HTMLInputAttributes, 'name'>;

	// `bind:value`, not a spread: Svelte then keeps what was typed before hydration, where a spread
	// value would overwrite it with the server's.
	let { label, name, error, hint, value = $bindable(), ...input }: Props = $props();
	const id = $props.id();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<input
		{id}
		{name}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={[error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') ||
			undefined}
		bind:value
		{...input}
	/>
	{#if hint}<span class="hint" id="{id}-hint">{hint}</span>{/if}
	{#if error}<span class="error" id="{id}-error">{error}</span>{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	label {
		font-size: 0.875rem;
	}

	.hint {
		font-size: 0.8125rem;
		opacity: 0.85;
	}

	.error {
		font-size: 0.875rem;
		color: rgb(255, 170, 170);
	}

	input[aria-invalid='true'] {
		border-color: rgb(230, 90, 90);
	}
</style>
