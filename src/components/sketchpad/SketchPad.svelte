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
  } from '../../constants/sketch-pad.js';
  import EraserHead from './EraserHead.svelte';
  import LogOutButton from '../LogOutButton.svelte';
  import ImageSelectorButton from './ImageSelectorButton.svelte';

  const hasPointer = window.PointerEvent;
  let canvas;
  let context;
  let eraser = {
    name: TOOL_ERASER,
    lineWidth: ERASER_SIZES.find(({ alias }) => alias === DEFAULT_SIZE_ALIAS).value,
    color: PEN_COLORS.find(({ alias }) => alias === DEFAULT_COLOR_ALIAS).value,
  };
  let isPointerActive = false;
  let pointerLocation = { x: 0, y: 0 };
  let pen = {
    name: TOOL_PEN,
    lineWidth: PEN_SIZES.find(({ alias }) => alias === DEFAULT_SIZE_ALIAS).value, 
    color: PEN_COLORS.find(({ alias }) => alias === DEFAULT_COLOR_ALIAS).value
  };
  let selectedTool;
  let selectedImageId;
  let strokes = [];
  let strokesIndex = 0;
  let rafID;


  $: eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;
  $: isErasing = selectedTool && selectedTool.name === TOOL_ERASER;
  $: selectedImage = gastroImages.find(({ id }) => id === selectedImageId);
  $: src = selectedImage ? selectedImage.url : null;

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
    canvas.addEventListener(eventType.down, onPointerDown, false);
    canvas.addEventListener(eventType.up, onPointerUp, false);
    canvas.addEventListener(eventType.move, onPointerMove, false);

    context = setupCanvas(canvas);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    selectPen();
  }

  function onPointerDown(event) {
    event.preventDefault();

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

    recordPoint(event, hasPointer);

    render();
  };

  function onPointerUp(event) {
    recordPoint(event);
    stopDrawing();
    ++strokesIndex;
  };

  function onPointerMove(event) {
    event.preventDefault();

    recordPoint(event);
  };

  function recordPoint (event) {
    pointerLocation = getPointerLocation(event, hasPointer)

    if (isPointerActive) strokes[strokesIndex].points = [...strokes[strokesIndex].points, pointerLocation];
  };

  function stopDrawing () {
    isPointerActive = false;
  };

  function selectEraser () {
    selectedTool = { ...eraser };
  };

  function selectPen () {
    selectedTool = { ...pen };
  };

  function clearCanvas () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function selectNewImage ({ detail: id }) {
    selectedImageId = id;
  }

  // TODO: handle window resize
  function resizeCanvas () {
    // work out the size difference
    // if the new canvas is smaller than the old one, shrink the image
    // if the new canvas is bigger than the old one, do not stretch it and place in the middle
    const widthDifference = window.innerWidth / canvas.width;
    const heightDifference = window.innerHeight / canvas.height;


    // we need to lock the aspect ratio of the new drawn canvas to be the same as the image

    /* **** */

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log('resize', widthDifference, heightDifference);
    render();
    // TODO: make sure the image is drawn in the middle of the updated canvas
  }

  function downloadImage () {
    const srcImg = document.querySelector('#displayed-image');
    const boundingRect = srcImg.getBoundingClientRect();
    const top = canvas.height - boundingRect.height;
    context.fillStyle = 'white';
    context.fillRect(0,0, canvas.width, canvas.height);
    context.drawImage(srcImg, 0, boundingRect.top, boundingRect.width, boundingRect.height);
    drawStrokes();

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
    canvas.removeEventListener(eventType.down, onPointerDown, false);
    canvas.removeEventListener(eventType.up, onPointerUp, false);
    canvas.removeEventListener(eventType.move, onPointerMove, false);
  });
</script>

<svelte:window
  on:resize={ debounce(resizeCanvas, 500) }
/>
<svelte:body
  on:mouseleave={ stopDrawing }
/>

<div class="paper">
  { #if src }
    <picture>
      <source
        type="image/webp"
        srcset={ src + '.webp' }
      />
      <img
        id="displayed-image"
        src={ src + '.jpg' }
        alt=""
      />
    </picture>
  { /if }

  <canvas
    bind:this={ canvas }
    style={ isPointerActive ? 'cursor: none;' : '' }
  ></canvas>
</div>

<div class="ui">
  <p>User is: { $user.email }</p>
  <LogOutButton />
  <button
    on:click={ selectEraser }
    disabled={ isErasing }
  >
    Eraser
  </button>
  <button
    on:click={ clearCanvas }
  >
    Erase all
  </button>
  <button
    on:click={ selectPen }
    disabled={ !isErasing }
  >
    Pen
  </button>
  <ImageSelectorButton
    options={ gastroImages }
    on:update={ selectNewImage 
    }
  />
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

  { #if isPointerActive && selectedTool }
    <EraserHead
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

  picture {
    display: block;
    position: relative;
    flex: 1;
  }

  picture > * {
    object-fit: contain;
    width: 100%;
    height: auto;
    display: block;
    max-width: 100vw;
    max-height: 100vh;
  }

  .paper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .ui {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  :global(.ui > *) {
    pointer-events: auto;
  }
</style>