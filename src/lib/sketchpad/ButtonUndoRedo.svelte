<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import { actions } from './stores.ts';
	import IconUndo from '../components/icons/IconUndo.svelte';
	import IconRedo from '../components/icons/IconRedo.svelte';
	import Tooltip from '../components/Tooltip.svelte';

	let { onredo, onundo }: { onredo?: () => void; onundo?: () => void } = $props();

	let position = $state({ x: 0, y: 0 });
	let tooltip = $state('');

	function handleEnter(element: HTMLElement, text: string) {
		const { left, top, width, height } = element.getBoundingClientRect();

		position = {
			x: left + width,
			y: top + height * 0.5
		};

		tooltip = text;
	}

	function handleLeave() {
		tooltip = '';
	}

	function redo() {
		tooltip = '';

		onredo?.();
	}

	function undo() {
		tooltip = '';

		onundo?.();
	}
</script>

<div class="undo-redo shadow">
	<button
		onclick={undo}
		onpointerenter={(event) => handleEnter(event.currentTarget, 'Undo action')}
		onpointerleave={handleLeave}
		disabled={$actions.first}
	>
		<IconUndo />
	</button>

	<hr />

	<button
		onclick={redo}
		onpointerenter={(event) => handleEnter(event.currentTarget, 'Redo action')}
		onpointerleave={handleLeave}
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
		background-color: var(--color-white);
		border-radius: var(--radius-pill);
		display: flex;
		position: relative;
	}

	button {
		background: transparent;
		border: none;
		font-size: var(--font-size-xl);
		padding: var(--space-3);
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
			padding-bottom: var(--space-1-5);
		}

		button:last-child {
			padding-top: var(--space-1-5);
		}

		hr {
			margin: 0.25em 0.5em;
		}
	}
</style>
