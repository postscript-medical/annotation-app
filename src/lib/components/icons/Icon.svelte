<script lang="ts">
	import type { Snippet } from 'svelte';

	// The frame every icon draws into: 24×24, 1em square, currentColor. The `<title>` (the icon's
	// accessible name) is rendered here, not by each icon: inside an icon's children Svelte infers
	// the namespace from the elements, and a `<title>` (also an HTML element) made it create the
	// whole fragment as HTML, so client-rendered icons drew nothing. `children` must hold only
	// SVG-only elements (path, circle, g, polygon, rect …).
	let { title, children }: { title: string; children: Snippet } = $props();
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
	<title>{title}</title>
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
