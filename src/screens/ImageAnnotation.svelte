<script>
  import {
    onMount,
  } from 'svelte';
  import { openShareModal } from '../stores.js';
  import {
    DEFAULT_COLOR_ID,
    DEFAULT_SHAPE_ID,
    DEFAULT_SIZE_ID,
    ERASER_SIZES,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SHAPE,
    TOOL_TEXT,
    PEN_COLORS,
    PEN_SIZES,
    SHAPE_ARROW,
    SHAPES,
  } from '../constants/sketch-pad.js';
  import SketchPad from '../components/sketchpad/SketchPad.svelte';
  import SketchPadUi from '../components/sketchpad/SketchPadUi.svelte';
  import ShareModal from '../modals/ShareModal.svelte';

  let eraser = {
    name: TOOL_ERASER,
    lineWidth: ERASER_SIZES.find(({ id }) => id === DEFAULT_SIZE_ID).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR_ID).value,
  };
  let pen = {
    name: TOOL_PEN,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE_ID).value, 
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR_ID).value
  };
  let selectedTool;
  let selectedToolId
  let shape = {
    name: TOOL_SHAPE,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE_ID).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR_ID).value,
    type: SHAPES.find(({ id }) => id === DEFAULT_SHAPE_ID).id,
  };

  $: {
    switch (selectedToolId) {
      case TOOL_ERASER:
        selectedTool = eraser;
        break;

      case TOOL_SHAPE:
        selectedTool = shape;
        break;

      case TOOL_TEXT:
        selectedTool = {};
        break;
    
      default:
        selectedTool = pen;
        break;
    }
  };

  function changeLineThickness ({ detail }) {
    const { thickness, toolId } = detail;
    if (toolId === TOOL_PEN) {
      pen = {
        ...pen,
        lineWidth: Number(thickness),
      };
    } else {
      eraser = {
        ...eraser,
        lineWidth: Number(thickness),
      };
    };
  };

  function changePenColor ({ detail: color }) {
    pen = {
      ...pen,
      color,
    };
  };

  function changeShapeType ({ detail: type }) {
    shape = {
      ...shape,
      type,
    };
  };

  function selectTool ({ detail: toolId }) {
    selectedToolId = toolId;
  };

  onMount(() => {
    selectTool({ detail: TOOL_PEN });
  });
</script>

<main>
    <SketchPad
      { pen }
      { shape }
      { selectedTool }
      { selectedToolId }
    />
    <SketchPadUi
      { eraser }
      { pen }
      { selectedToolId }
      { shape }
      on:change-thickness={ changeLineThickness }
      on:change-color={ changePenColor }
      on:change-shape={ changeShapeType }
      on:select-tool={ selectTool }
    />
</main>

{ #if $openShareModal }
  <ShareModal
    on:close={ () => $openShareModal = false }
  />
{ /if }

<style>
  main {
    background: rgb(250,250,250);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>