<script lang="ts">
	import type { Snippet } from 'svelte';

	// The frame every icon draws into: 24×24, 1em square, currentColor.
	let { children }: { children: Snippet } = $props();
</script>

<svg
	width="24px"
	height="24px"
	viewBox="0 0 24 24"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	fill="currentColor"
	role="img"
>
	{@render children()}
</svg>

<style>
	svg {
		height: 1em;
		stroke-linejoin: round;
		stroke-linecap: round;
		stroke-width: 2;
		width: 1em;
	}
</style>
