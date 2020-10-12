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

  function toggleShowImageGallery () {
    showImageGallery = !showImageGallery;
  };

  function selectTool (toolId) {
    dispatch('select-tool', toolId);
  }
</script>


<div
  class="ui"
>
  <ButtonTool
    className="search-icon"
    primaryValue={ showImageGallery && TOOL_SEARCH }
    toolName={ TOOL_SEARCH }
    on:change-primary={ toggleShowImageGallery }
  >
    { #if showImageGallery }
      <span>
        X
      </span>
    { :else }
      <span>
        I
      </span>
    { /if }
  </ButtonTool>
  
  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_PEN }
    secondaryTools={ PEN_SIZES }
    secondaryValue={ pen.lineWidth }
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail: thickness }) => changeLineThickness(thickness, TOOL_PEN) }
  >
    <span>
      P
    </span>
  </ButtonTool>

  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_ERASER }
    secondaryTools={ ERASER_SIZES }
    secondaryValue={ eraser.lineWidth }
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail: thickness }) => changeLineThickness(thickness, TOOL_ERASER) }
  >
    <span>
      E
    </span>
  </ButtonTool>

  <ButtonTool
    toolName={ TOOL_ERASE_ALL}
    on:change-primary={ eraseAll }
  >
    <span>
      A
    </span>
  </ButtonTool>

  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_SHAPE }
    secondaryTools={ SHAPES }
    secondaryValue={ shape.type }
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail: shape }) => changeShape(shape) }
  >
    S
  </ButtonTool>

  <ButtonTool
    primaryValue={ selectedToolId }
    toolName={ TOOL_TEXT }
    on:change-primary={ ({detail}) => selectTool(detail) }
  >
    T
  </ButtonTool>

  <ColorPalette
    colors={ PEN_COLORS }
    selected={ pen.color }
    on:change={ ({ detail }) => changeColor(detail) }
  />

  { #if showImageGallery }
    <ImageSelector />
  { /if }
</div>


<style>
  .ui {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    pointer-events: none;
    padding: 8rem 2rem 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .ui > :global(:first-child) {
    z-index: 10;
  }
</style>