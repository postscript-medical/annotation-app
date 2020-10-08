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
    TOOL_SHAPE,
    TOOL_TEXT,
    SHAPES,
  } from '../../constants/sketch-pad.js';
  import ToolButton from './ToolButton.svelte';
  import ColorPalette from './ColorPalette.svelte';

  export let pen;
  export let eraser;
  export let selectedToolId
  export let shape;

  const dispatch = createEventDispatcher();

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

  function selectTool (toolId) {
    dispatch('select-tool', toolId);
  }
</script>


<div
  class="ui"
>
  <ToolButton
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
  </ToolButton>

  <ToolButton
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
  </ToolButton>

  <ToolButton
    toolName={ TOOL_ERASE_ALL}
    on:change-primary={ eraseAll }
  >
    <span>
      A
    </span>
  </ToolButton>

  <ToolButton
    primaryValue={ selectedToolId }
    toolName={ TOOL_SHAPE }
    secondaryTools={ SHAPES }
    secondaryValue={ shape.type }
    on:change-primary={ ({ detail: toolId }) => selectTool(toolId) }
    on:change-secondary={ ({ detail: shape }) => changeShape(shape) }
  >
    S
  </ToolButton>

  <ToolButton
    primaryValue={ selectedToolId }
    toolName={ TOOL_TEXT }
    on:change-primary={ ({detail}) => selectTool(detail) }
  >
    T
  </ToolButton>

  <ColorPalette
    colors={ PEN_COLORS }
    selected={ pen.color }
    on:change={ ({ detail }) => changeColor(detail) }
  />
</div>


<style>
  .ui {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    left: 50%;
    top: 0;
    pointer-events: none;
    padding: 8rem 2rem 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* look into removing, handle this at the individual component */
  :global(.ui button),
  :global(.ui label),
  :global(.ui select) {
    pointer-events: auto;
  }
</style>