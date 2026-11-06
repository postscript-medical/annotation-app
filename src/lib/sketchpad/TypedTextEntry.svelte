<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { EVENTS_TOUCH } from './constants.ts';
	import type { EventNames, TextDrag } from './types.ts';
	import ButtonIcon from './ButtonIcon.svelte';
	import IconClose from '../components/icons/IconClose.svelte';
	import DragHandle from './DragHandle.svelte';

	type Props = {
		content: string;
		eventType?: EventNames;
		index?: number;
		x?: number;
		y?: number;
		color: string;
		onclose?: (index: number) => void;
		ondrag?: (drag: TextDrag) => void;
		oninput?: (change: { index: number; content: string }) => void;
	};

	let {
		content,
		eventType = EVENTS_TOUCH,
		index = 1,
		x = 0,
		y = 0,
		color,
		onclose,
		ondrag,
		oninput
	}: Props = $props();

	let container = $state<HTMLDivElement>();
	let textarea = $state<HTMLTextAreaElement>();
	let boundingRect = $state.raw<DOMRect>();

	const style = $derived(`transform: translate3d(${x}px,${y}px,0px)`);

	onMount(() => {
		boundingRect = container!.getBoundingClientRect();

		// A new note takes the focus, unless something else has it. Not the `autofocus` attribute:
		// WebKit acts on it later and can move focus back to an earlier note.
		if (document.activeElement === document.body) textarea!.focus();
	});
</script>

<div bind:this={container} class="typed-text-entry" {style}>
	<textarea
		bind:this={textarea}
		class="typed-annotation"
		style={`color: ${color};`}
		value={content}
		oninput={(event) => oninput?.({ index, content: event.currentTarget.value })}></textarea>
	<DragHandle {boundingRect} {eventType} {index} {ondrag} />
	<ButtonIcon onclick={() => onclose?.(index)}>
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
