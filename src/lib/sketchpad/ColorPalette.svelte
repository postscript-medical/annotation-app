<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.9. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
	import { createEventDispatcher } from 'svelte';
	import Tooltip from '../components/Tooltip.svelte';

	export let colors = [];
	export let selected;
	export let tooltip = '';

	const dispatch = createEventDispatcher();

	let showTooltip = false;
	let position = { x: 0, y: 0 };

	function changeColor() {
		showTooltip = false;

		dispatch('change', this.value);
	}

	function handleEnter() {
		const { left, top, width, height } = this.getBoundingClientRect();

		position = {
			x: left + width,
			y: top + height / 2
		};

		showTooltip = true;
	}

	function handleLeave() {
		showTooltip = false;
	}
</script>

<!-- The hover only shows the tooltip; the radio inputs are the controls. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="colors-palette shadow" on:pointerenter={handleEnter} on:pointerleave={handleLeave}>
	{#each colors as color (color.id)}
		<label id={'palette-' + color.id}>
			<input name="color-palette" type="radio" value={color.value} on:change={changeColor} />
			<svg class="tool-icon" viewBox="0 0 100 100" width="24px" height="24px">
				{#if selected === color.value}
					<circle cx="50" cy="50" r="60" stroke={color.value} fill="none" />
				{/if}
				<circle cx="50" cy="50" r="50" fill={color.value} />
			</svg>
		</label>
	{/each}
</div>

{#if tooltip && showTooltip}
	<Tooltip x={position.x} y={position.y}>
		{tooltip}
	</Tooltip>
{/if}

<style>
	.colors-palette {
		background-color: white;
		border-radius: 1.5rem;
		display: flex;
		align-items: center;
	}

	svg {
		overflow: visible;
	}

	circle {
		stroke-width: 0.5rem;
	}

	@media screen and (min-width: 900px) {
		.colors-palette {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
