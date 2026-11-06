<script lang="ts">
	import type { Snippet } from 'svelte';

	// A small label next to a point (legacy PsTooltip). Positioned `fixed` in the viewport, so it
	// escapes clipping containers without the legacy Portal; nudged back inside the window if it
	// would overflow. `x`, `y`: viewport coordinates of the point it labels.
	let { x = 0, y = 0, children }: { x?: number; y?: number; children?: Snippet } = $props();

	let width = $state(0);
	let height = $state(0);
	// Unknown until mounted (server render): no nudging then.
	let innerWidth = $state(Infinity);
	let innerHeight = $state(Infinity);

	const position = $derived.by(() => {
		let left = x + 4;
		let top = y - height * 0.5;
		const overflowX = width + x - innerWidth;
		const overflowY = height + y - innerHeight;
		if (overflowX > 0) left -= overflowX + 4;
		if (overflowY > 0) top -= overflowY;
		return { left, top };
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<p
	class="tooltip shadow"
	role="tooltip"
	data-testid="tooltip"
	bind:clientWidth={width}
	bind:clientHeight={height}
	style:transform="translate({position.left}px, {position.top}px)"
>
	{#if children}{@render children()}{:else}Tooltip copy missing{/if}
</p>

<style>
	.tooltip {
		background-color: var(--color-white);
		border-radius: 0.5em;
		left: 0;
		margin: 0;
		padding: 0.25em 0.5em;
		pointer-events: none;
		position: fixed;
		top: 0;
		z-index: var(--z-tooltip);
	}
</style>
