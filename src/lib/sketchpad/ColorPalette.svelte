<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import Tooltip from '../components/Tooltip.svelte';

	type Props = {
		colors?: { id: string; value: string }[];
		selected: string;
		tooltip?: string;
		onchange?: (color: string) => void;
	};

	let { colors = [], selected, tooltip = '', onchange }: Props = $props();

	let showTooltip = $state(false);
	let position = $state({ x: 0, y: 0 });

	function changeColor(color: string) {
		showTooltip = false;

		onchange?.(color);
	}

	function handleEnter(element: HTMLElement) {
		const { left, top, width, height } = element.getBoundingClientRect();

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
<div
	class="colors-palette shadow"
	role="presentation"
	onpointerenter={(event) => handleEnter(event.currentTarget)}
	onpointerleave={handleLeave}
>
	{#each colors as color (color.id)}
		<label id={'palette-' + color.id}>
			<input
				name="color-palette"
				type="radio"
				value={color.value}
				onchange={() => changeColor(color.value)}
			/>
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
		background-color: var(--color-white);
		border-radius: var(--radius-pill);
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
