<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		value?: string | null;
		onDark?: boolean;
		testId?: string;
		onclick?: (value: string | null) => void;
		onenter?: (element: HTMLElement) => void;
		onleave?: () => void;
		children: Snippet;
	};

	let {
		value = null,
		onDark = false,
		testId = '',
		onclick,
		onenter,
		onleave,
		children
	}: Props = $props();
</script>

<button
	class:on-dark={onDark}
	class="shadow"
	data-testid={testId}
	onclick={() => onclick?.(value)}
	onpointerenter={(event) => onenter?.(event.currentTarget)}
	onpointerleave={() => onleave?.()}
>
	{@render children()}
</button>

<style>
	button {
		align-items: center;
		background-color: var(--color-white);
		border-radius: var(--radius-round);
		border: 0;
		display: flex;
		font-size: var(--font-size-xl);
		justify-content: center;
		margin: 0;
		padding: var(--space-3);
	}

	.on-dark {
		background-color: var(--color-ink);
		color: var(--color-white);
	}
</style>
