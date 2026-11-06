<script lang="ts" generics="T extends string | number">
	import type { Snippet } from 'svelte';

	// A labelled select (legacy PsDropdown). With `editable` false it shows the value as text.
	// `style`: "inline" and/or "horizontal" (default) / "vertical".
	type Option = { label: string; value: T };
	type Props = {
		options: Option[];
		value?: T | null;
		direction?: 'horizontal' | 'vertical';
		style?: string;
		disabled?: boolean;
		editable?: boolean;
		onchange?: (value: T) => void;
		children?: Snippet;
	};

	let {
		options,
		value = $bindable(null),
		direction = 'horizontal',
		style = '',
		disabled = false,
		editable = true,
		onchange,
		children
	}: Props = $props();

	const className = $derived(`${style} ${direction}`.trim());
	const shown = $derived(options.find((option) => option.value === value)?.label ?? value);
</script>

{#if editable}
	<label class={className} class:disabled>
		<span>{@render children?.()}</span>
		<select {disabled} bind:value onchange={() => value !== null && onchange?.(value)}>
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
{:else}
	<span class={className} class:disabled>
		<span>{@render children?.()}</span>
		<span>{shown}</span>
	</span>
{/if}

<style>
	label {
		display: flex;
	}

	span {
		flex-shrink: 0;
	}

	.inline :global(select) {
		padding-left: 0;
		padding-bottom: 0;
		padding-top: 0;
		line-height: 1;
		border: 0;
		border-radius: 0;
		background-color: transparent;
		color: var(--color-ink);
	}

	.disabled {
		opacity: 0.5;
	}

	.horizontal {
		flex-direction: row;
		align-items: baseline;
	}
	.horizontal > :not(:last-child):not(:empty) {
		margin-right: var(--space-2);
	}

	.vertical {
		flex-direction: column;
		align-items: flex-start;
	}
	.vertical > :not(:last-child):not(:empty) {
		margin-bottom: var(--space-1);
	}
</style>
