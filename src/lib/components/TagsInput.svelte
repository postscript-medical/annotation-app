<script lang="ts">
	import type { Snippet } from 'svelte';

	// A comma-separated list in a text input (legacy PsTagsInput). `oninput` gets the list.
	// `style`: "horizontal" (default), "vertical" or "inline".
	type Props = {
		tags?: string[];
		style?: 'horizontal' | 'vertical' | 'inline';
		placeholder?: string;
		readonly?: boolean;
		disabled?: boolean;
		oninput?: (tags: string[]) => void;
		children?: Snippet;
	};

	let {
		tags = [],
		style = 'horizontal',
		placeholder = '',
		readonly = false,
		disabled = false,
		oninput,
		children
	}: Props = $props();
</script>

<label class="container {style}" class:disabled>
	<span>{@render children?.()}</span>
	<input
		type="text"
		{placeholder}
		{readonly}
		{disabled}
		value={tags.join(',')}
		oninput={(event) => oninput?.(event.currentTarget.value.split(','))}
	/>
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
