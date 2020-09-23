<script>
  import {
    onDestroy,
    onMount,
  } from 'svelte';
  import getPointerLocation from './helpers/get-pointer-location.js';
  import { user } from '../../stores.js';
  import { gastroImages } from './helpers/fake-database.js';
  import LogOutButton from '../LogOutButton.svelte';
  import ImageSelectorButton from './ImageSelectorButton.svelte';

  const TOOL_ERASER = 'eraser';
  const TOOL_PEN = 'pen';

  const hasPointer = window.PointerEvent;
  let canvas;
  let context;
  let mouse = { x: 0, y: 0 };
  let selectedTool;
  let selectedImageId;
  let eventType = {
    down: 'touchstart',
    up: 'touchend',
    move: 'touchmove',
  };

  $: isErasing = selectedTool === TOOL_ERASER;
  $: selectedImage = gastroImages.find(({ id }) => id === selectedImageId);
  $: src = selectedImage ? selectedImage.url : null;

  function init() {
    if (hasPointer) {
      eventType = {
        down: 'pointerdown',
        up: 'pointerup',
        move: 'pointermove'
      }
    };

    context = canvas.getContext( '2d' );

    resizeCanvas();
    canvas.addEventListener( eventType.down, onDocumentPointerDown, false );
    canvas.addEventListener( eventType.up, onDocumentPointerUp, false );

    selectPen();
  }

  function onDocumentPointerDown( event ) {
    event.preventDefault();
    
    mouse = getPointerLocation( event, hasPointer )

    canvas.addEventListener( eventType.move, onDocumentPointerMove, false );
  }

  function onDocumentPointerUp( event ) {
    canvas.removeEventListener( eventType.move, onDocumentPointerMove, false );
  }

  function onDocumentPointerMove( event ) {
    event.preventDefault();

    var location = getPointerLocation( event, hasPointer );

    if (isErasing) {
      erase(location);
    } else {
      draw(location);
    }

    mouse = getPointerLocation( event, hasPointer )
  }

  function draw (location) {
    // TODO: research a way to create smoother lines when moving drawing too fast
    context.beginPath();
    context.moveTo( mouse.x, mouse.y );
    context.lineTo( location.x, location.y );
    context.stroke();
  };

  function erase (location) {
    // TODO: Try and fill the gap between arcs when moving the eraser very fast
    context.save();
    context.beginPath();
    context.arc(mouse.x, mouse.y, 32, 0, (2 * 3.14159));
    context.fill()
    context.restore();
  };

  function selectEraser () {
    // TODO: have a visual aid to show the size of the eraser
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = 'rgb(0,0,0)';
    context.lineWidth = 1;
    selectedTool = TOOL_ERASER;
  };

  function selectPen () {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = 'rgb(0,0,0)';
    context.lineWidth = 3;
    selectedTool = TOOL_PEN;
  };

  function eraseAll () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function selectNewImage ({ detail: id }) {
    selectedImageId = id;
  }

  // TODO: handle window resize
  function resizeCanvas () {
    console.log('resize');
    // TODO:  debounce this

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // TODO: make sure the image is drawn in the middle of the updated canvas

  }

  onMount(() => {
    window.addEventListener('resize', resizeCanvas, false);
    init();
  });

  onDestroy(() => {
    window.removeEventListener('resize', resizeCanvas, false);
    canvas.removeEventListener( eventType.down, onDocumentPointerDown, false );
    canvas.removeEventListener( eventType.up, onDocumentPointerUp, false );
  });
</script>

<div class="paper">
  { #if src }
    <picture>
      <source
        type="image/webp"
        srcset={ src + '.webp' }
      />
      <img
        src={ src + '.jpg' }
        alt=""
      />
    </picture>
  { /if }

  <canvas
    bind:this={ canvas }
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
    on:click={ eraseAll }
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
</div>


<style>
  canvas {
    display: block;
    box-sizing: border-box;
    position: absolute;
    left: 0;
    top: 0;
    cursor: crosshair;
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