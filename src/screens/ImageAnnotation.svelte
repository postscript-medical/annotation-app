<script>
  import {
    onMount,
  } from 'svelte';
  import {
    openShareModal,
    selectedIllustrationTitle,
    user
  } from '../stores.js';
  import {
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    SHAPE_ARROW,
    SHAPES,
  } from '../constants/sketch-pad.js';
  import {
    DEFAULT_COLOR,
    DEFAULT_SHAPE,
    DEFAULT_SIZE,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from '../constants/defaults.js';
  import SketchPad from '../components/sketchpad/SketchPad.svelte';
  import SketchPadUi from '../components/sketchpad/SketchPadUi.svelte';
  import ShareModal from '../modals/ShareModal.svelte';
  import { tweenOut } from '../components/sketchpad/Illustration.svelte';

  let eraser = {
    name: TOOL_ERASER,
    lineWidth: ERASER_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value,
  };
  let pen = {
    name: TOOL_PEN,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE).value, 
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value
  };
  let selectedTool;
  let selectedToolId
  let shape = {
    name: TOOL_SHAPE,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value,
    type: SHAPES.find(({ id }) => id === DEFAULT_SHAPE).id,
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

  function selectIllustration ({ detail: illustrationTitle}) {
    /*
    * This is adding the illustrationTitle to Netlify's user.user_metadata.
    * We need to be very careful here as currently there is no way to remove this data
    * once it is stored there. At some point in the future we should store this somewhere else.
    * Right now it does not seem like a great idea as we don't want to run a Lambda function
    * every time the user changes an illustration, it would end up costing us a lot of money.
    */
    $user
      .update({
        data: {
          illustrationTitle
        }
      })
      .then(updatedUser => {
        $user = updatedUser
      })
      .catch(error => console.error(error));

    tweenOut(() => $selectedIllustrationTitle = illustrationTitle);
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
      on:select-tool={ selectTool }
    />
    <SketchPadUi
      { eraser }
      { pen }
      { selectedToolId }
      { shape }
      on:change-thickness={ changeLineThickness }
      on:change-color={ changePenColor }
      on:change-shape={ changeShapeType }
      on:select-illustration={ selectIllustration }
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
    height: 100vh;
  }
</style>