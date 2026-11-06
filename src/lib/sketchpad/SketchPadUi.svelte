<!-- From legacy components/sketchpad. Legacy `PsHeader user={$user} loggedIn` → `Header signedIn
     onLight` with the feedback (2.6) and share (2.5) buttons and the user menu (2.4). -->
<script lang="ts">
	import {
		ERASER_SIZES,
		PEN_COLORS,
		PEN_SIZES,
		SHAPES,
		TOOL_CATALOGUE,
		TOOL_ERASE_ALL,
		TOOL_ERASER,
		TOOL_PEN,
		TOOL_SHAPE,
		TOOL_TEXT
	} from './constants.ts';
	import type { EraserTool, PenTool, SecondaryTool, ShapeTool, ShapeType } from './types.ts';
	import type { Size } from '../components/icons/sizes.ts';
	import ButtonUndoRedo from './ButtonUndoRedo.svelte';
	import ButtonTool from './ButtonTool.svelte';
	import ColorPalette from './ColorPalette.svelte';
	import IconEraser from '../components/icons/IconEraser.svelte';
	import IconPen from '../components/icons/IconPen.svelte';
	import IconText from '../components/icons/IconText.svelte';
	import IconHome from '../components/icons/IconHome.svelte';
	import IconShapes from '../components/icons/IconShapes.svelte';
	import Button from '../components/Button.svelte';
	import Header from '../components/Header.svelte';
	import UserSettingsDropdown from '../annotate/UserSettingsDropdown.svelte';

	type Props = {
		pen: PenTool;
		eraser: EraserTool;
		selectedToolId?: string;
		shape: ShapeTool;
		/** First letter of the account email, for the user-menu button (2.4). */
		accountInitial?: string;
		onchangethickness: (change: { thickness: number; toolId: string }) => void;
		onchangecolor: (color: string) => void;
		onchangeshape: (type: ShapeType) => void;
		onerase: () => void;
		onopencatalogue: () => void;
		onopenshare: () => void;
		onopenfeedback: () => void;
		onredo: () => void;
		onselecttool: (toolId: string) => void;
		onundo: () => void;
	};

	let {
		pen,
		eraser,
		selectedToolId,
		shape,
		accountInitial = '',
		onchangethickness,
		onchangecolor,
		onchangeshape,
		onerase,
		onopencatalogue,
		onopenshare,
		onopenfeedback,
		onredo,
		onselecttool,
		onundo
	}: Props = $props();

	function changeEraser({ value, id }: { value: number | string; id: string }) {
		if (id === TOOL_ERASE_ALL) {
			onerase();

			return;
		}

		onchangethickness({ thickness: Number(value), toolId: TOOL_ERASER });
	}
</script>

{#snippet sizeOption(option: SecondaryTool)}
	<div class="secondary-tool">
		<option.component size={option.id as Size} />
	</div>
{/snippet}

{#snippet shapeOption(option: SecondaryTool)}
	<div class="secondary-tool">
		<option.component />
	</div>
{/snippet}

<div class="ui ui-content">
	<Header signedIn onLight>
		{#snippet actions()}
			<Button style="tertiary" onclick={onopenfeedback}>Feedback?</Button>
			<Button style="tertiary" onclick={onopenshare}>Share annotation</Button>
			<UserSettingsDropdown initial={accountInitial} />
		{/snippet}
	</Header>

	<ButtonTool
		primaryValue=""
		toolName={TOOL_CATALOGUE}
		tooltip="Image catalogue"
		onchangeprimary={onopencatalogue}
	>
		<IconHome />
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		secondaryTools={PEN_SIZES}
		secondaryValue={pen.lineWidth}
		toolName={TOOL_PEN}
		tooltip="Annotate"
		onchangeprimary={onselecttool}
		onchangesecondary={({ value }) =>
			onchangethickness({ thickness: Number(value), toolId: TOOL_PEN })}
		secondaryTool={sizeOption}
	>
		<IconPen />
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		toolName={TOOL_ERASER}
		tooltip="Erase"
		secondaryTools={ERASER_SIZES}
		secondaryValue={eraser.lineWidth}
		onchangeprimary={onselecttool}
		onchangesecondary={changeEraser}
		secondaryTool={sizeOption}
	>
		<IconEraser />
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		toolName={TOOL_SHAPE}
		tooltip="Shapes"
		secondaryTools={SHAPES}
		secondaryValue={shape.type}
		onchangeprimary={onselecttool}
		onchangesecondary={({ value }) => onchangeshape(value as ShapeType)}
		secondaryTool={shapeOption}
	>
		<IconShapes />
	</ButtonTool>

	<ButtonTool
		primaryValue={selectedToolId}
		toolName={TOOL_TEXT}
		tooltip="Type text"
		onchangeprimary={onselecttool}
	>
		<IconText />
	</ButtonTool>

	<ColorPalette
		colors={PEN_COLORS}
		tooltip="Colors"
		selected={pen.color}
		onchange={onchangecolor}
	/>

	<ButtonUndoRedo {onredo} {onundo} />
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
