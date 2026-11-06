<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.9. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
	import { createEventDispatcher, onMount } from 'svelte';
	import { EVENTS_TOUCH } from './constants.js';
	import ButtonIcon from './ButtonIcon.svelte';
	import IconClose from '../components/icons/IconClose.svelte';
	import DragHandle from './DragHandle.svelte';

	export let content;
	export let eventType = EVENTS_TOUCH;
	export let index = 1;
	export let x = 0;
	export let y = 0;
	export let color;

	const dispatch = createEventDispatcher();
	let container;
	let boundingRect;

	$: style = `transform: translate3d(${x}px,${y}px,0px)`;

	function closeEntry() {
		dispatch('close', { index });
	}

	function updateContent({ target }) {
		dispatch('input', { index, content: target.value });
	}

	onMount(() => {
		boundingRect = container.getBoundingClientRect();
	});
</script>

<div bind:this={container} class="typed-text-entry" {style}>
	<!-- svelte-ignore a11y_autofocus -->
	<textarea autofocus class="typed-annotation" style={`color: ${color};`} on:input={updateContent}
		>{content}</textarea
	>
	<DragHandle {boundingRect} {eventType} {index} on:drag />
	<ButtonIcon on:click={closeEntry}>
		<IconClose />
	</ButtonIcon>
</div>

<style>
	.typed-text-entry {
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: auto;
	}

	.typed-text-entry > :global(:not(textarea)) {
		position: absolute;
		opacity: 0;
		top: -1.25rem;
		left: -1.25rem;
		transition: opacity 100ms linear;
	}

	.typed-text-entry:hover > :global(:not(textarea)) {
		opacity: 1;
	}

	.typed-text-entry > :global(:last-child) {
		left: auto;
		right: -1.25rem;
	}

	.typed-annotation {
		background: rgba(255, 255, 255, 0.5);
		border-color: black;
		border-width: 2px;
	}

	.typed-annotation:focus {
		background-color: white;
	}
</style>
