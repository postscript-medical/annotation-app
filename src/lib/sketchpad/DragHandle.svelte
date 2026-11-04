<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.8. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import IconDrag from '../components/icons/IconDrag.svelte';

	export let index;
	export let eventType;
	export let boundingRect = { width: 0, height: 0 };

	const dispatch = createEventDispatcher();
	let dragHandler;

	$: width = boundingRect.width;
	$: height = boundingRect.height;

	function startDrag() {
		dispatch('drag', { index, active: true, width, height });

		window.addEventListener(eventType.up, stopDrag, false);
	}

	function stopDrag() {
		dispatch('drag', { index, active: false });

		window.removeEventListener(eventType.up, stopDrag, false);
	}

	onMount(() => {
		dragHandler.addEventListener(eventType.down, startDrag, false);
	});

	onDestroy(() => {
		dragHandler.removeEventListener(eventType.down, startDrag, false);
	});
</script>

<button bind:this={dragHandler} class="drag-handle shadow">
	<IconDrag />
</button>

<style>
	.drag-handle {
		background: white;
		border: 0;
		border-radius: 50%;
		cursor: grab;
		font-size: 1.25rem;
		left: 0;
		padding: 0.75rem;
		text-align: center;
	}
</style>
