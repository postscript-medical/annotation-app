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
  let canvasHistory = [];
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

  function onDocumentPointerUp() {
    disableDrawing();
  }

  function onDocumentPointerMove( event ) {
    event.preventDefault();

    var location = getPointerLocation( event, hasPointer );

    if (isErasing) {
      erase(mouse);
    } else {
      draw(location, mouse);
    }

    mouse = getPointerLocation( event, hasPointer );
  }

  function disableDrawing () {
    canvas.removeEventListener( eventType.move, onDocumentPointerMove, false );
  }

  function draw ( _location, _pointer, redrawing ) {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = 'rgb(0,0,0)';
    context.lineWidth = 3;
    // TODO: research a way to create smoother lines when moving drawing too fast
    context.beginPath();
    context.moveTo( _pointer.x, _pointer.y );
    context.lineTo( _location.x, _location.y );
    context.stroke();

    if (redrawing) return;

    recordCanvasHistory({
      _pointer: {
        x: _pointer.x,
        y: _pointer.y,
      },
      _location: {
        x: _location.x,
        y: _location.y,
      },
    });
  };

  function erase ( _mouse, redrawing ) {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = 'rgb(0,0,0)';
    context.lineWidth = 1;
    // TODO: Try and fill the gap between arcs when moving the eraser very fast
    context.save();
    context.beginPath();
    context.arc(_mouse.x, _mouse.y, 32, 0, 6.28318); /* 6.28318 is approx. 1 radian */
    context.fill()
    context.restore();

    if (redrawing) return;

    recordCanvasHistory({
      _pointer: {
        x: _mouse.x,
        y: _mouse.y,
      },
    });
  };

  function redraw () {
    console.log('redrawing:', canvasHistory);
    canvasHistory.forEach(({ action, _pointer, _location }) => {
      if (action === TOOL_PEN) {
        draw(_location, _pointer, true);
      } else {
        erase(_pointer, true);
      };
    });

    // canvasHistory = [];
  };

  function recordCanvasHistory ( { _pointer, _location } ) {
    canvasHistory = [
        ...canvasHistory,
        {
          action: selectedTool,
          _pointer,
          _location,
        }
      ];
  };

  function selectEraser () {
    // TODO: have a visual aid to show the size of the eraser
    selectedTool = TOOL_ERASER;
  };

  function selectPen () {
    selectedTool = TOOL_PEN;
  };

  function eraseAll () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function selectNewImage ( { detail: id } ) {
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

  function downloadImage () {
    const srcImg = document.querySelector('#displayed-image');
    const boundingRect = srcImg.getBoundingClientRect();
    const top = canvas.height - boundingRect.height;
    context.fillStyle = 'white';
    context.fillRect(0,0, canvas.width, canvas.height);
    context.drawImage(srcImg, 0, boundingRect.top, boundingRect.width, boundingRect.height);
    redraw();

    const imageURI = canvas.toDataURL('image/jpg', 0.7);
    const hiddenLink = document.createElement('a');
    hiddenLink.setAttribute('href', imageURI);
    hiddenLink.setAttribute('download', 'myImage.jpg');
    hiddenLink.click();
  };

  onMount(() => {
    init();
  });

  onDestroy(() => {
    canvas.removeEventListener( eventType.down, onDocumentPointerDown, false );
    canvas.removeEventListener( eventType.up, onDocumentPointerUp, false );
  });
</script>

<svelte:window
  on:resize={ resizeCanvas }
/>
<svelte:body
  on:mouseleave={ disableDrawing }
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
  <button
    on:click={ redraw }
    disabled={ canvasHistory < 1 }
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