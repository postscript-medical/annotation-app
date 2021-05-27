<script>
  import { createEventDispatcher } from "svelte";
  import {
    actions,
    canvasElement,
    context,
    illustrationSearchQuery,
  } from "../../stores.js";
  import {
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    SHAPES,
  } from "../../constants/sketch-pad.js";
  import {
    TOOL_ERASE_ALL,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SEARCH,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from "../../constants/defaults.js";
  import ColorPalette from "./ColorPalette.svelte";
  import IconClose from "../icons/IconClose.svelte";
  import IconEraser from "../icons/IconEraser.svelte";
  import IconPen from "../icons/IconPen.svelte";
  import IconText from "../icons/IconText.svelte";
  import IconSearch from "../icons/IconSearch.svelte";
  import IconShapes from "../icons/IconShapes.svelte";
  import ImageSelector from "../ImageSelector.svelte";
  import ButtonTool from "./ButtonTool.svelte";

  export let pen;
  export let eraser;
  export let selectedToolId;
  export let shape;

  const dispatch = createEventDispatcher();

  let showImageGallery = false;

  function changeLineThickness(thickness, toolId) {
    dispatch("change-thickness", { thickness, toolId });
  }

  function changeColor(color) {
    dispatch("change-color", color);
  }

  function changeShape(shape) {
    dispatch("change-shape", shape);
  }

  function eraseAll() {
    $context.clearRect(0, 0, $canvasElement.width, $canvasElement.height);
    actions.set([]);
  }

  function handleEraserSecondaryTool(secondaryToolId, thickness, toolId) {
    if (secondaryToolId === TOOL_ERASE_ALL) {
      eraseAll();

      return;
    }

    changeLineThickness(thickness, toolId);
  }

  function selectIllustration({ detail: title }) {
    eraseAll();

    dispatch("select-illustration", title);
  }

  function selectTool(toolId) {
    dispatch("select-tool", toolId);
  }

  function toggleShowImageGallery() {
    illustrationSearchQuery.set("");

    showImageGallery = !showImageGallery;
  }
</script>

<div class="ui main-content">
  <ButtonTool
    primaryValue={showImageGallery && TOOL_SEARCH}
    toolName={TOOL_SEARCH}
    on:change-primary={toggleShowImageGallery}>
    {#if showImageGallery}
      <IconClose />
    {:else}
      <IconSearch />
    {/if}
  </ButtonTool>

  <ButtonTool
    primaryValue={selectedToolId}
    secondaryTools={PEN_SIZES}
    secondaryValue={pen.lineWidth}
    toolName={TOOL_PEN}
    on:change-primary={({ detail: toolId }) => selectTool(toolId)}
    on:change-secondary={({ detail }) => changeLineThickness(detail.value, TOOL_PEN)}>
    <IconPen />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class="secondary-tool"
      class:on-dark={onDark}>
      <svelte:component
        this={secondaryTool.component}
        size={secondaryTool.id} />
    </div>
  </ButtonTool>

  <ButtonTool
    primaryValue={selectedToolId}
    toolName={TOOL_ERASER}
    secondaryTools={ERASER_SIZES}
    secondaryValue={eraser.lineWidth}
    on:change-primary={({ detail: toolId }) => selectTool(toolId)}
    on:change-secondary={({ detail }) => handleEraserSecondaryTool(detail.id, detail.value, TOOL_ERASER)}>
    <IconEraser />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class="secondary-tool"
      class:on-dark={onDark}>
      <svelte:component
        this={secondaryTool.component}
        size={secondaryTool.id} />
    </div>
  </ButtonTool>

  <ButtonTool
    primaryValue={selectedToolId}
    toolName={TOOL_SHAPE}
    secondaryTools={SHAPES}
    secondaryValue={shape.type}
    on:change-primary={({ detail: toolId }) => selectTool(toolId)}
    on:change-secondary={({ detail }) => changeShape(detail.value)}>
    <IconShapes />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class="secondary-tool"
      class:on-dark={onDark}>
      <svelte:component this={secondaryTool.component} />
    </div>
  </ButtonTool>

  <ButtonTool
    primaryValue={selectedToolId}
    toolName={TOOL_TEXT}
    on:change-primary={({ detail }) => selectTool(detail)}>
    <IconText />
  </ButtonTool>

  <ColorPalette
    colors={PEN_COLORS}
    selected={pen.color}
    on:change={({ detail }) => changeColor(detail)} />
</div>

<ImageSelector
  show={showImageGallery}
  on:select-illustration={selectIllustration}
  on:close={toggleShowImageGallery} />

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
    border-top-width: 5.5rem;
  }

  .ui > :global(:not(:first-child)) {
    margin-left: 1rem;
    margin-top: 1rem;
  }

  .ui > :global(:first-child) {
    z-index: 10;
    position: absolute;
    left: 0;
    top: 0;
  }

  .secondary-tool {
    padding: 0.5rem;
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
</style>
