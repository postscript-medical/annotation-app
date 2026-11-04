<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.8. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
	import { createEventDispatcher } from 'svelte';
	import { actions } from './stores.js';
	import IconUndo from '../components/icons/IconUndo.svelte';
	import IconRedo from '../components/icons/IconRedo.svelte';
	import Tooltip from '../components/Tooltip.svelte';

	const dispatch = createEventDispatcher();

	let position = { x: 0, y: 0 };
	let tooltip = '';

	function handleEnter(details) {
		const { left, top, width, height } = details.event.target.getBoundingClientRect();

		position = {
			x: left + width,
			y: top + height * 0.5
		};

		tooltip = details.tooltip;
	}

	function handleLeave() {
		tooltip = '';
	}

	function redo() {
		tooltip = '';

		dispatch('redo');
	}

	function undo() {
		tooltip = '';

		dispatch('undo');
	}
</script>

<div class="undo-redo shadow">
	<button
		on:click={undo}
		on:pointerenter={(event) => {
			handleEnter({ event, tooltip: 'Undo action' });
		}}
		on:pointerleave={handleLeave}
		disabled={$actions.first}
	>
		<IconUndo />
	</button>

	<hr />

	<button
		on:click={redo}
		on:pointerenter={(event) => {
			handleEnter({ event, tooltip: 'Redo action' });
		}}
		on:pointerleave={handleLeave}
		disabled={$actions.last}
	>
		<IconRedo />
	</button>

	{#if tooltip}
		<Tooltip x={position.x} y={position.y}>
			{tooltip}
		</Tooltip>
	{/if}
</div>

<style>
	.undo-redo {
		background-color: white;
		border-radius: 1.5rem;
		display: flex;
		position: relative;
	}

	button {
		background: transparent;
		border: none;
		font-size: 1.25rem;
		padding: 0.75rem;
		margin: 0;
		line-height: 1;
	}

	button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	hr {
		border-top: 0;
		border-right: 0;
		margin: 0.5em 0.25em;
	}

	@media screen and (min-width: 900px) {
		.undo-redo {
			flex-direction: column;
		}

		button:first-child {
			padding-bottom: 0.375rem;
		}

		button:last-child {
			padding-top: 0.375rem;
		}

		hr {
			margin: 0.25em 0.5em;
		}
	}
</style>
