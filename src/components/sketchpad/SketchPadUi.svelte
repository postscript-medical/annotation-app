<script>
  import { createEventDispatcher } from "svelte";
  import {
    actions,
    canvasElement,
    context,
    illustrationSearchQuery,
    protectedContent,
    selectedSubSpecialty,
    selectedSpecialty,
    user,
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
  import ButtonTool from "./ButtonTool.svelte";
  import ColorPalette from "./ColorPalette.svelte";
  import IconClose from "../icons/IconClose.svelte";
  import IconEraser from "../icons/IconEraser.svelte";
  import IconPen from "../icons/IconPen.svelte";
  import IconText from "../icons/IconText.svelte";
  import IconImages from "../icons/IconImages.svelte";
  import IconShapes from "../icons/IconShapes.svelte";
  import ImageSelector from "../ImageSelector.svelte";
  import ColorWheel from "../ColorWheel.svelte";
  import PsHeader from "../PsHeader.svelte";

  export let pen;
  export let eraser;
  export let selectedToolId;
  export let shape;

  const dispatch = createEventDispatcher();

  let showImageGallery = false;
  let tempAppState = {};

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

  function selectIllustration({ detail: illustration }) {
    eraseAll();

    dispatch("select-illustration", illustration);
  }

  function selectTool(toolId) {
    dispatch("select-tool", toolId);
  }

  function openImageGallery() {
    illustrationSearchQuery.set("");

    tempAppState = { ...$protectedContent.appState };

    showImageGallery = true;
  }

  function hideImageGallery() {
    // reset the appState
    $protectedContent.appState = { ...tempAppState };

    $selectedSpecialty = tempAppState.selectedSpecialty;
    $selectedSubSpecialty = tempAppState.selectedSubSpecialty;

    closeImageGallery();
  }

  function closeImageGallery() {
    showImageGallery = false;
  }
</script>

<div class="ui ui-content">
  <PsHeader user={$user} loggedIn />

  {#if showImageGallery}
    <ButtonTool
      primaryValue=""
      toolName={TOOL_SEARCH}
      on:change-primary={hideImageGallery}
    >
      <IconClose />
    </ButtonTool>
  {:else}
    <ButtonTool
      primaryValue=""
      toolName={TOOL_SEARCH}
      tooltip="Image catalog"
      on:change-primary={openImageGallery}
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
  {/if}
</div>

<ImageSelector
  show={showImageGallery}
  on:select-illustration={selectIllustration}
  on:close={closeImageGallery}
/>

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
