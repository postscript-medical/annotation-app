<script>
  import { createEventDispatcher } from "svelte";
  import { user } from "../../stores.js";
  import {
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    SHAPES,
  } from "../../constants/sketch-pad.js";
  import {
    IMAGE_CATALOGUE,
    TOOL_ERASE_ALL,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SEARCH,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from "../../constants/defaults.js";
  import ButtonUndoRedo from "./ButtonUndoRedo.svelte";
  import ButtonTool from "./ButtonTool.svelte";
  import ColorPalette from "./ColorPalette.svelte";
  import IconEraser from "../icons/IconEraser.svelte";
  import IconPen from "../icons/IconPen.svelte";
  import IconText from "../icons/IconText.svelte";
  import IconImages from "../icons/IconImages.svelte";
  import IconShapes from "../icons/IconShapes.svelte";
  import ColorWheel from "../ColorWheel.svelte";
  import PsHeader from "../PsHeader.svelte";

  export let pen;
  export let eraser;
  export let selectedToolId;
  export let shape;

  const dispatch = createEventDispatcher();

  function changeLineThickness(thickness, toolId) {
    dispatch("change-thickness", { thickness, toolId });
  }

  function changeColor(color) {
    dispatch("change-color", color);
  }

  function changeShape(shape) {
    dispatch("change-shape", shape);
  }

  function eraseAnnotation() {
    dispatch("erase-annotation");
  }

  function handleEraserSecondaryTool(secondaryToolId, thickness, toolId) {
    if (secondaryToolId === TOOL_ERASE_ALL) {
      eraseAnnotation();

      return;
    }

    changeLineThickness(thickness, toolId);
  }

  function selectTool(toolId) {
    dispatch("select-tool", toolId);
  }

  function openIllustrationCatalogue() {
    dispatch("open-catalogue", IMAGE_CATALOGUE);
  }
</script>

<div class="ui ui-content">
  <PsHeader user={$user} loggedIn />

  <ButtonTool
    primaryValue=""
    toolName={TOOL_SEARCH}
    tooltip="Image catalogue"
    on:change-primary={openIllustrationCatalogue}
  >
    <IconImages />
  </ButtonTool>

  <ButtonTool
    primaryValue={selectedToolId}
    secondaryTools={PEN_SIZES}
    secondaryValue={pen.lineWidth}
    toolName={TOOL_PEN}
    tooltip="Annotate"
    on:change-primary={({ detail: toolId }) => selectTool(toolId)}
    on:change-secondary={({ detail }) =>
      changeLineThickness(detail.value, TOOL_PEN)}
  >
    <IconPen />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class="secondary-tool"
      class:on-dark={onDark}
    >
      <svelte:component
        this={secondaryTool.component}
        size={secondaryTool.id}
      />
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
      <svelte:component
        this={secondaryTool.component}
        size={secondaryTool.id}
      />
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

  <!-- If IE11 -->
  <ColorPalette
    colors={PEN_COLORS}
    tooltip="Colors"
    selected={pen.color}
    on:change={({ detail }) => changeColor(detail)}
  />
  <!-- Else -->
  <ColorWheel
    tooltip="Colors"
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
