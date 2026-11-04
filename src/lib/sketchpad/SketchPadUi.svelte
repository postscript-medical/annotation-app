<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.8.
     Legacy `PsHeader user={$user} loggedIn` → `Header signedIn onLight`; its share, feedback and
     user-menu buttons arrive with /annotate (2.4–2.6). -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
	import { createEventDispatcher } from 'svelte';
	import {
		ERASER_SIZES,
		IMAGE_CATALOGUE,
		PEN_COLORS,
		PEN_SIZES,
		SHAPES,
		TOOL_CATALOGUE,
		TOOL_ERASE_ALL,
		TOOL_ERASER,
		TOOL_PEN,
		TOOL_SHAPE,
		TOOL_TEXT
	} from './constants.js';
	import ButtonUndoRedo from './ButtonUndoRedo.svelte';
	import ButtonTool from './ButtonTool.svelte';
	import ColorPalette from './ColorPalette.svelte';
	import IconEraser from '../components/icons/IconEraser.svelte';
	import IconPen from '../components/icons/IconPen.svelte';
	import IconText from '../components/icons/IconText.svelte';
	import IconHome from '../components/icons/IconHome.svelte';
	import IconShapes from '../components/icons/IconShapes.svelte';
	import Header from '../components/Header.svelte';

	export let pen;
	export let eraser;
	export let selectedToolId;
	export let shape;

	const dispatch = createEventDispatcher();

	function changeLineThickness(thickness, toolId) {
		dispatch('change-thickness', { thickness, toolId });
	}

	function changeColor(color) {
		dispatch('change-color', color);
	}

	function changeShape(shape) {
		dispatch('change-shape', shape);
	}

	function eraseAnnotation() {
		dispatch('erase-annotation');
	}

	function handleEraserSecondaryTool(secondaryToolId, thickness, toolId) {
		if (secondaryToolId === TOOL_ERASE_ALL) {
			eraseAnnotation();

			return;
		}

		changeLineThickness(thickness, toolId);
	}

	function selectTool(toolId) {
		dispatch('select-tool', toolId);
	}

	function openIllustrationCatalogue() {
		dispatch('open-catalogue', IMAGE_CATALOGUE);
	}
</script>

<div class="ui ui-content">
	<Header signedIn onLight />

	<ButtonTool
		primaryValue=""
		toolName={TOOL_CATALOGUE}
		tooltip="Image catalogue"
		on:change-primary={openIllustrationCatalogue}
	>
		<IconHome />
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		secondaryTools={PEN_SIZES}
		secondaryValue={pen.lineWidth}
		toolName={TOOL_PEN}
		tooltip="Annotate"
		on:change-primary={({ detail: toolId }) => selectTool(toolId)}
		on:change-secondary={({ detail }) => changeLineThickness(detail.value, TOOL_PEN)}
	>
		<IconPen />
		<div
			slot="secondary-tool"
			let:secondaryTool
			let:onDark
			class="secondary-tool"
			class:on-dark={onDark}
		>
			<svelte:component this={secondaryTool.component} size={secondaryTool.id} />
		</div>
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		toolName={TOOL_ERASER}
		tooltip="Erase"
		secondaryTools={ERASER_SIZES}
		secondaryValue={eraser.lineWidth}
		on:change-primary={({ detail: toolId }) => selectTool(toolId)}
		on:change-secondary={({ detail }) =>
			handleEraserSecondaryTool(detail.id, detail.value, TOOL_ERASER)}
	>
		<IconEraser />
		<div
			slot="secondary-tool"
			let:secondaryTool
			let:onDark
			class="secondary-tool"
			class:on-dark={onDark}
		>
			<svelte:component this={secondaryTool.component} size={secondaryTool.id} />
		</div>
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		toolName={TOOL_SHAPE}
		tooltip="Shapes"
		secondaryTools={SHAPES}
		secondaryValue={shape.type}
		on:change-primary={({ detail: toolId }) => selectTool(toolId)}
		on:change-secondary={({ detail }) => changeShape(detail.value)}
	>
		<IconShapes />
		<div
			slot="secondary-tool"
			let:secondaryTool
			let:onDark
			class="secondary-tool"
			class:on-dark={onDark}
		>
			<svelte:component this={secondaryTool.component} />
		</div>
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		toolName={TOOL_TEXT}
		tooltip="Type text"
		on:change-primary={({ detail }) => selectTool(detail)}
	>
		<IconText />
	</ButtonTool>

	<ColorPalette
		colors={PEN_COLORS}
		tooltip="Colors"
		selected={pen.color}
		on:change={({ detail }) => changeColor(detail)}
	/>

	<ButtonUndoRedo on:redo on:undo />
</div>

<style>
	.ui {
		position: fixed;
		pointer-events: none;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: flex-end;
		align-content: flex-end;
		left: 0;
		top: 0;
		height: 100%;
		width: 100%;
		max-height: auto;
		z-index: 3;
	}

	.ui > :global(:not(:first-child)) {
		margin-left: 1rem;
		margin-top: 1rem;
	}

	.ui > :global(:first-child) {
		z-index: 10;
		padding: 0;
		position: absolute;
		left: 0;
		top: 0;
	}

	.secondary-tool {
		padding: 0.5rem;
		cursor: pointer;
	}

	@media screen and (min-width: 900px) {
		.ui {
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			align-content: flex-start;
		}

		.ui > :global(*) {
			margin-bottom: 1rem;
			margin-top: 0;
		}

		.ui > :global(:not(:first-child)) {
			margin-left: 0;
			margin-top: 0;
		}

		.ui > :global(:first-child) {
			position: relative;
			left: auto;
			top: auto;
		}
	}

	@media print {
		.ui {
			display: none;
		}
	}
</style>
