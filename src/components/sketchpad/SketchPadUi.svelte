<script>
  import { createEventDispatcher } from 'svelte';
  import {
    actions,
    canvas,
    context,
  } from '../../stores.js';
  import {
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    TOOL_ERASE_ALL,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SEARCH,
    TOOL_SHAPE,
    TOOL_TEXT,
    SHAPES,
  } from '../../constants/sketch-pad.js';
  import ColorPalette from './ColorPalette.svelte';
  import IconClose from '../icons/IconClose.svelte';
  import IconEraser from '../icons/IconEraser.svelte';
  import IconPen from '../icons/IconPen.svelte';
  import IconTrashBin from '../icons/IconTrashBin.svelte';
  import IconText from '../icons/IconText.svelte';
  import IconSearch from '../icons/IconSearch.svelte';
  import IconShapes from '../icons/IconShapes.svelte';
  import ImageSelector from '../ImageSelector.svelte';
  import ButtonTool from './ButtonTool.svelte';

  export let pen;
  export let eraser;
  export let selectedToolId
  export let shape;

  const dispatch = createEventDispatcher();

  let showImageGallery = false;

  function changeLineThickness (thickness, toolId) {
    dispatch('change-thickness', { thickness, toolId });
  };

  function changeColor (color) {
    dispatch('change-color', color);
  };

  function changeShape (shape) {
    dispatch('change-shape', shape)
  };

  function eraseAll () {
    $context.clearRect(0, 0, $canvas.width, $canvas.height);
    $actions = [];
  };

  function handleEraserSecondaryTool (secondaryToolId, thickness, toolId) {
    if (secondaryToolId === TOOL_ERASE_ALL) {
      eraseAll();

      return;
    }

    changeLineThickness(thickness, toolId);
  };

  function toggleShowImageGallery () {
    showImageGallery = !showImageGallery;
  };

  function selectTool (toolId) {
    dispatch('select-tool', toolId);
  }
</script>


<div
  class="ui aspect-ratio-lock main-content"
>
  <ButtonTool
    primaryValue={ showImageGallery && TOOL_SEARCH }
    toolName={ TOOL_SEARCH }
    let:onDark
    on:change-primary={ toggleShowImageGallery }
  >
    { #if showImageGallery }
      <IconClose
        { onDark }
      />
    { :else }
      <IconSearch
        { onDark }
      />
    { /if }
  </ButtonTool>
  
  <ButtonTool
    primaryValue={ selectedToolId }
    secondaryTools={ PEN_SIZES }
    secondaryValue={ pen.lineWidth }
    toolName={ TOOL_PEN }
    let:onDark
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail }) => changeLineThickness(detail.value, TOOL_PEN) }
  >
    <IconPen
      { onDark }
    />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class:on-dark={ onDark }
    >
      <svelte:component
        this={ secondaryTool.component }
        { onDark }
        size={ secondaryTool.id }
      />
    </div>
  </ButtonTool>

  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_ERASER }
    secondaryTools={ ERASER_SIZES }
    secondaryValue={ eraser.lineWidth }
    let:onDark
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail }) => handleEraserSecondaryTool(detail.id, detail.value, TOOL_ERASER) }
  >
    <IconEraser
      { onDark }
    />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class:on-dark={ onDark }
    >
      <svelte:component
        this={ secondaryTool.component }
        { onDark }
        size={ secondaryTool.id }
      />
    </div>
  </ButtonTool>

  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_SHAPE }
    secondaryTools={ SHAPES }
    secondaryValue={ shape.type }
    let:onDark
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail }) => changeShape(detail.value) }
  >
    <IconShapes
      { onDark }
    />
    <div
      slot="secondary-tool"
      let:secondaryTool
      let:onDark
      class:on-dark={ onDark }
    >
      <svelte:component
        this={ secondaryTool.component }
        { onDark }
      />
    </div>
  </ButtonTool>

  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_TEXT }
    let:onDark
    on:change-primary={ ({detail}) => selectTool(detail) }
  >
    <IconText
      { onDark }
    />
  </ButtonTool>

  <ColorPalette
    colors={ PEN_COLORS }
    selected={ pen.color }
    on:change={ ({ detail }) => changeColor(detail) }
  />

  { #if showImageGallery }
    <ImageSelector
      on:close={ toggleShowImageGallery }
    />
  { /if }
</div>


<style>
  .ui {
    position: absolute;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    left: 0;
    top: 0;
    padding-top: 8rem;
    height: 100%;
    max-height: none;
  }

  .ui > :global(:first-child) {
    z-index: 10;
  }
</style>