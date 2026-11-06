<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import type { Point } from './types.ts';

	let { position = { x: -1000, y: -1000 }, size = 10 }: { position?: Point; size?: number } =
		$props();

	const radius = $derived(size / 2);

	const style = $derived(
		`width: ${size}px; height: ${size}px; transform: translate3d(${
			position.x - radius
		}px,${position.y - radius}px,0px);`
	);
</script>

<div {style}></div>

<style>
	div {
		position: fixed;
		left: 0;
		top: 0;
		border: 1px solid var(--color-black);
		border-radius: var(--radius-round);
		pointer-events: none;
	}
</style>
