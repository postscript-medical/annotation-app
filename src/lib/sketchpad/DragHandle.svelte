<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import IconDrag from '../components/icons/IconDrag.svelte';
	import type { EventNames, TextDrag } from './types.ts';

	type Props = {
		index: number;
		eventType: EventNames;
		boundingRect?: { width: number; height: number };
		ondrag?: (drag: TextDrag) => void;
	};

	let { index, eventType, boundingRect = { width: 0, height: 0 }, ondrag }: Props = $props();

	let dragHandler = $state<HTMLButtonElement>();

	function startDrag() {
		const { width, height } = boundingRect;
		ondrag?.({ index, active: true, width, height });

		window.addEventListener(eventType.up, stopDrag, false);
	}

	function stopDrag() {
		ondrag?.({ index, active: false });

		window.removeEventListener(eventType.up, stopDrag, false);
	}

	onMount(() => {
		const handle = dragHandler!;
		const down = eventType.down;
		handle.addEventListener(down, startDrag, false);

		return () => handle.removeEventListener(down, startDrag, false);
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
