<script>
  import {
    onDestroy,
    onMount,
  } from 'svelte';
  import getPointerLocation from './helpers/get-pointer-location.js';
  import debounce from './helpers/debounce.js';
  import setupCanvas from './helpers/setup-canvas.js';
  import { gastroImages } from './helpers/fake-database.js';
  import { user } from '../../stores.js';
  import {
    DEFAULT_COLOR_ALIAS,
    DEFAULT_SIZE_ALIAS,
    EVENTS_POINTER,
    EVENTS_TOUCH,
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_TEXT,
  } from '../../constants/sketch-pad.js';
  import ImageSelectorButton from './ImageSelectorButton.svelte';
  import LogOutButton from '../LogOutButton.svelte';
  import StokeCursor from './StokeCursor.svelte';
  import TypedTextEntry from './TypedTextEntry.svelte';

  const hasPointer = window.PointerEvent;
  // TODO: replace strokes with actions
  let actions = [];
  let canvas;
  let context;
  let eraser = {
    name: TOOL_ERASER,
    lineWidth: ERASER_SIZES.find(({ alias }) => alias === DEFAULT_SIZE_ALIAS).value,
    color: PEN_COLORS.find(({ alias }) => alias === DEFAULT_COLOR_ALIAS).value,
  };
  let isPointerActive = false;
  let dragTypedText = { index: 0, active: false };
  let offsetTop = 0;
  let paper;
  let pen = {
    name: TOOL_PEN,
    lineWidth: PEN_SIZES.find(({ alias }) => alias === DEFAULT_SIZE_ALIAS).value, 
    color: PEN_COLORS.find(({ alias }) => alias === DEFAULT_COLOR_ALIAS).value
  };
  let pointerLocation = { x: 0, y: 0 };
  let rafID;
  let selectedToolId;
  let selectedImageId;
  let strokes = [];
  let strokesIndex = 0;
  let typedText = [];
  let typedTextIndex = 0;


  $: eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;
  $: isErasing = selectedTool && selectedTool.name === TOOL_ERASER;
  $: selectedImage = gastroImages.find(({ id }) => id === selectedImageId);
  $: selectedTool = selectedToolId && selectedToolId === TOOL_PEN ? pen : eraser;
  $: src = selectedImage ? selectedImage.url : null;

  function addStroke (event ) {
    isPointerActive = true;

    strokes = [
      ...strokes,
      {
        action: selectedTool.name,
        lineWidth: selectedTool.lineWidth,
        color: selectedTool.color,
        points: [],
      }
    ];

    recordPoint(event);

    render();
  };

  function addTypedText (event) {
    recordPoint(event);

    typedText = [
      ...typedText,
      {
        content: '',
        eventType,
        index: typedTextIndex,
        x: pointerLocation.x,
        y: pointerLocation.y - offsetTop,
      }
    ];

    ++typedTextIndex;
  };

  function drawTypedText (parentBoundingRect) {
    const entries = Array.from(paper.querySelectorAll('.typed-annotation'));
    context.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
    context.textBaseline = 'middle';
    entries.forEach(entry => {
      const boundingRect = entry.getBoundingClientRect();
      const x = boundingRect.x - parentBoundingRect.x + 7; /* 7 is the padding in the input */
      const y = boundingRect.y - parentBoundingRect.y + (boundingRect.height / 2);
      context.fillStyle = 'black';
      context.fillText(entry.value, x, y);
    });
  };

  function drawStrokes () {
    strokes.forEach(({ action, lineWidth, color, points }) => {
      if (points.length < 3) return;

      const maxIndex = points.length - 2;
      const isDrawing = action === TOOL_PEN;

      context.save();
      context.globalCompositeOperation = isDrawing ? 'source-over' : 'destination-out';
      context.strokeStyle = color;
      context.beginPath();
      context.lineWidth = lineWidth;
      context.moveTo(points[0].x, points[0].y);

      for(let i = 1; i < maxIndex; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      context.quadraticCurveTo(points[maxIndex].x, points[maxIndex].y, points[maxIndex+1].x,points[maxIndex+1].y);
      context.stroke();
      context.restore();
    });
  };

  function init() {
    document.body.addEventListener(eventType.up, stopDrawing, false);
    canvas.addEventListener(eventType.down, onPointerDown, false);
    canvas.addEventListener(eventType.up, onPointerUp, false);
    paper.addEventListener(eventType.move, onPointerMove, false);

    context = setupCanvas(canvas);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    selectPenTool();

    resizeCanvas();
  }

  function onPointerDown(event) {
    event.preventDefault();

    if (selectedToolId === TOOL_TEXT) {
      addTypedText(event);

      return;
    };

    addStroke(event);
  };

  function onPointerUp(event) {
    recordPoint(event);
    stopDrawing();
  };

  function onPointerMove(event) {
    event.preventDefault();

    recordPoint(event);

    if (dragTypedText.active) {
      const targetIndex = typedText.findIndex(({ index }) => index === dragTypedText.index)
      typedText[targetIndex] = {
        ...typedText[targetIndex],
        x: pointerLocation.x,
        y: pointerLocation.y - offsetTop,
      };

      typedText = [...typedText];
    };
  };

  function recordPoint (event) {
    pointerLocation = getPointerLocation(event, hasPointer);

    if (isPointerActive) strokes[strokesIndex].points = [
      ...strokes[strokesIndex].points,
      {
        x: pointerLocation.x,
        y: pointerLocation.y - offsetTop,
      }
    ];
  };

  function resizeCanvas () {
    // TODO: Investigate options for when the screen size ends up clipping the canvas due to the locked ratio
    const oldSize = { width: canvas.width, height: canvas.height };

    context = setupCanvas(canvas);

    updateOffsetTop();

    const scaleFactor = { width: canvas.width / oldSize.width, height: canvas.height / oldSize.height };

    // loop over the history, replace the x,y points according to the new canvas size
    strokes = strokes.map(stroke => {
      return {
        ...stroke,
        points: stroke.points.map(({ x, y }) => {
          return {
            x: x * scaleFactor.width,
            y: y * scaleFactor.height,
          }
        })
      }
    });

    typedText = typedText.map(text => {
      return {
        ...text,
        x: text.x * scaleFactor.width,
        y: text.y * scaleFactor.height,
      }
    })

    render();
  };

  function stopDrawing () {
    if (isPointerActive) ++strokesIndex;
    isPointerActive = false;
  };

  function selectEraserTool () {
    selectedToolId = TOOL_ERASER;
  };

  function selectPenTool () {
    selectedToolId = TOOL_PEN;
  };

  function selectTextTool () {
    selectedToolId = TOOL_TEXT;
  };

  function clearCanvas () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  function selectNewImage ({ detail: id }) {
    selectedImageId = id;
  };

  function toggleTypedTextDrag ({ detail }) {
    dragTypedText = detail;
  }; 

  function updateOffsetTop () {
    offsetTop = canvas.getBoundingClientRect().top;
  };

  // This probably won't be needed :(
  function updateTypedTextEntryContent ({ detail }) {
    const targetIndex = typedText.findIndex(({ index }) => index === detail.index);
    typedText[targetIndex] = {
      ...typedText[targetIndex],
      content: detail.content,
    };

    typedText = [...typedText];
  };

  function removeTypedTextEntry ({ detail }) {
    const targetIndex = typedText.findIndex(({ index }) => index === detail.index);
    let updatedArray = [...typedText];
    updatedArray.splice(targetIndex, 1);

    typedText = updatedArray;
  };

  function downloadImage () {
    const srcImg = document.querySelector('#displayed-image');
    const boundingRect = canvas.getBoundingClientRect();

    context.fillStyle = 'white';
    context.fillRect(0,0, canvas.width, canvas.height);
    context.drawImage(srcImg, 0, 0, canvas.width, canvas.height);
    drawStrokes();

    drawTypedText(boundingRect);

    const imageURI = canvas.toDataURL('image/jpg', 0.7);
    const hiddenLink = document.createElement('a');
    hiddenLink.setAttribute('href', imageURI);
    hiddenLink.setAttribute('download', 'myImage.jpg');
    hiddenLink.click();
  };

  function render () {
    clearCanvas();

    drawStrokes();
  
    if (isPointerActive) {
      rafID = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(rafID);
    }
  };

  onMount(() => {
    init();
  });

  onDestroy(() => {
    document.body.removeEventListener(eventType.up, stopDrawing, false);
    canvas.removeEventListener(eventType.down, onPointerDown, false);
    canvas.removeEventListener(eventType.up, onPointerUp, false);
    paper.removeEventListener(eventType.move, onPointerMove, false);
  });
</script>

<svelte:window
  on:resize={ debounce(resizeCanvas, 125) }
/>

<div
  bind:this={ paper }
  class="paper"
>
  { #if src }
    <img id="displayed-image" { src } alt="" />
  { /if }

  <canvas
    bind:this={ canvas }
    style={ isPointerActive ? 'cursor: none;' : '' }
  ></canvas>

  <div class="typed-text">
    { #each typedText as entry (entry.index) }
      <TypedTextEntry
        { ...entry }
        on:close={ removeTypedTextEntry }
        on:drag={ toggleTypedTextDrag }
        on:input={ updateTypedTextEntryContent }
      />
    { /each }
  </div>
</div>

<div class="ui">
  <div>
    <p>Pointer location: { pointerLocation.x } | { pointerLocation.y }</p>
    <p>Stroke index: { strokesIndex }</p>
    <span>User is: { $user.email }</span>
    <LogOutButton />
  </div>
  <div>
    <button
      on:click={ selectEraserTool }
      disabled={ isErasing }
    >
      Eraser
    </button>
    <button
      on:click={ clearCanvas }
    >
      Erase all
    </button>
    <form>
    { #each ERASER_SIZES as size }
      <label>
        <input
          type="radio"
          value={ size.value }
          bind:group={ eraser.lineWidth }
        />
        { size.alias }
      </label>
    { /each }
  </form>
  </div>
  <div>
    <button
      on:click={ selectPenTool }
      disabled={ !isErasing }
    >
      Pen
    </button>
    <p>Color</p>
    <form>
    { #each PEN_COLORS as color }
      <label>
        <input
          type="radio"
          value={ color.value }
          bind:group={ pen.color }
        />
        { color.alias }
      </label>
    { /each }
  </form>
  <p>Size</p>
  <form>
    { #each PEN_SIZES as size }
      <label>
        <input
          type="radio"
          value={ size.value }
          bind:group={ pen.lineWidth }
        />
        { size.alias }
      </label>
    { /each }
  </form>
  </div>
  <div>
    <ImageSelectorButton
      options={ gastroImages }
      on:update={ selectNewImage 
      }
    />
  </div>
  <div>
    <button
      on:click={ render }
      disabled={ strokes.length === 0 }
    >
      Redraw
    </button>
    <button
      on:click={ downloadImage }
      disabled={ !selectedImage }
    >
      Download
    </button>
  </div>
  <div>
    <button
      on:click={ selectTextTool }
    >
      Write
    </button>
  </div>

  { #if isPointerActive && selectedTool }
    <StokeCursor
      position={ pointerLocation }
      size={ selectedTool.lineWidth }
    />
  { /if }
</div>


<style>
  canvas {
    display: block;
    box-sizing: border-box;
    position: absolute;
    left: 0;
    top: 0;
    cursor: crosshair;
    touch-action: none;
    width: 100%;
    height: 100%;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  .paper {
    background: white;
    position: relative;
    flex: 1;
  }
  .paper::before {
    content: '';
    width: 1px;
    margin-left: -1px;
    height: 0;
    padding-top: calc(768 / 1024 * 100%);
    float: left;
  }
  .paper::after {
    content: '';
    display: table;
    clear: both;
  }

  .typed-text {
    height: 100%;
    position: absolute;
    width: 100%;
    pointer-events: none;
    left: 0;
    top: 0;
  }

  .ui {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    pointer-events: none;
    padding: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  :global(.ui button),
  :global(.ui label),
  :global(.ui select) {
    pointer-events: auto;
  }
</style>