<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	// A labelled text input (legacy PsTextInput). `style`: "horizontal" (default), "vertical" or
	// "inline" (underline only). Bind `value`, or listen with `oninput`.
	type Props = {
		style?: 'horizontal' | 'vertical' | 'inline';
		value?: string;
		children?: Snippet;
	} & Omit<HTMLInputAttributes, 'style' | 'value' | 'children'>;

	let {
		style = 'horizontal',
		value = $bindable(''),
		type = 'text',
		size = 20,
		disabled = false,
		children,
		...rest
	}: Props = $props();
</script>

<label class="container {style}" class:disabled>
	<span>{@render children?.()}</span>
	<input {type} {size} {disabled} bind:value {...rest} />
</label>

<style>
	input:read-only {
		border-color: transparent;
		background-color: transparent;
	}

	span {
		flex-shrink: 0;
	}

	.container {
		display: flex;
		align-items: flex-start;
	}

	.inline :global(input) {
		border-left: 0;
		border-right: 0;
		border-top: 0;
		border-radius: 0;
		padding: 0;
		flex: 0 auto;
		line-height: 1.5;
	}

	.disabled {
		opacity: 0.5;
	}

	.horizontal {
		flex-direction: row;
		align-items: baseline;
	}
	.inline > :not(:last-child):not(:empty),
	.horizontal > :not(:last-child):not(:empty) {
		margin-right: 0.5rem;
	}

	.vertical {
		flex-direction: column;
	}
	.vertical > :not(:last-child):not(:empty) {
		margin-bottom: 0.25rem;
	}
</style>
