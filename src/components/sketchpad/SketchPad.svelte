<script>
  import {
    onDestroy,
    onMount,
  } from 'svelte';
  import getPointerLocation from './helpers/get-pointer-location.js';
  import { user } from '../../stores.js';
  import debounce from './helpers/debounce.js';
  import { gastroImages } from './helpers/fake-database.js';
  import LogOutButton from '../LogOutButton.svelte';
  import ImageSelectorButton from './ImageSelectorButton.svelte';

  const TOOL_ERASER = 'eraser';
  const TOOL_PEN = 'pen';
  const RADIAN = 6.28318; /* 6.28318 is approx. 1 radian */

  const hasPointer = window.PointerEvent;
  const inMemoryCanvas = document.createElement('canvas');
  const inMemoryContext = inMemoryCanvas.getContext('2d');
  let canvas;
  /*
  * canvasHistory = [{
  *  action: string
  *  _pointer: { x: number, y: number },
  *  _location: { x: number, y: number },
  * }]
  */
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

    canvas.addEventListener( eventType.down, onDocumentPointerDown, false );
    canvas.addEventListener( eventType.up, onDocumentPointerUp, false );

    resizeCanvas();

    selectPen();
  }

  function onDocumentPointerDown(event) {
    event.preventDefault();
    
    mouse = getPointerLocation( event, hasPointer )

    canvas.addEventListener(eventType.move, onDocumentPointerMove, false);
  }

  function onDocumentPointerUp() {
    disableDrawing();
  }

  function onDocumentPointerMove(event) {
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

  function draw (_location, _pointer, redrawing) {
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

  function erase (_pointer, redrawing) {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = 'rgb(0,0,0)';
    context.lineWidth = 1;
    // TODO: Try and fill the gap between arcs when moving the eraser very fast
    // work out the distance between the two circles and draw a box between them
    context.save();
    context.beginPath();
    context.arc(_pointer.x, _pointer.y, 32, 0, RADIAN);
    context.fill();
    context.restore();

    if (redrawing) return;

    // context.globalCompositeOperation = 'source-over';
    // context.beginPath();
    // context.arc(_pointer.x, _pointer.y, 32, 0, RADIAN);
    // context.fillStyle = "#FF6A6A";
    // context.fill();

    // If we createa dom element and set it to follow the mouse, we can achieve the same result

    recordCanvasHistory({
      _pointer: {
        x: _pointer.x,
        y: _pointer.y,
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

    // Only delete history if the user clicked to redraw
    // canvasHistory = [];
  };

  function recordCanvasHistory ({ _pointer, _location }) {
    canvasHistory = [
        ...canvasHistory,
        {
          action: selectedTool,
          _pointer,
          _location,
        }
      ];
  };

  let eraserHead;
  function createEraserHead () {
    eraserHead = document.createElement('div');
    eraserHead.setAttribute('id', 'eraser-head');
    document.body.appendChild(eraserHead);
    document.addEventListener(eventType.move, followPointer, false);
  };

  function destroyEraserHead () {
    // const eraserHead = document.querySelector('#eraser-head');
    if (eraserHead) {
      eraserHead.parentNode.removeChild(eraserHead);
      document.removeEventListener(eventType.move, followPointer, false);
    }
  };

  function followPointer (event) {
    mouse = getPointerLocation(event, hasPointer);
    console.log('mouse', mouse);
    console.log('eraser', eraserHead);
    eraserHead.style.transform = `translate3d(${mouse.x - 21}px,${mouse.y - 21}px,0px)`;
  };

  function selectEraser () {
    // TODO: have a visual aid to show the size of the eraser
    createEraserHead();
    selectedTool = TOOL_ERASER;
  };

  function selectPen () {
    destroyEraserHead();
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
    // work out the size difference
    // if the new canvas is smaller than the old one, shrink the image
    // if the new canvas is bigger than the old one, do not stretch it and place in the middle
    const widthDifference = window.innerWidth / canvas.width;
    const heightDifference = window.innerHeight / canvas.height;

    // loop over the history, replace the x,y points according to the new canvas size
    canvasHistory = canvasHistory.map(({ action, _pointer, _location }) => {
      return {
        action: action,
        _pointer: { x: _pointer.x * widthDifference, y: _pointer.y * heightDifference },
        _location: _location ? { x: _location.x * widthDifference, y: _location.y * heightDifference } : undefined,
      }
    });

    // we need to lock the aspect ratio of the new drawn canvas to be the same as the image

    /* **** */

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log('resize', widthDifference, heightDifference);
    eraseAll();
    redraw();
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
  on:resize={ debounce(resizeCanvas, 500) }
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
    touch-action: none;
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

  :global(#eraser-head) {
    position: absolute;
    left: 0;
    top: 0;
    border: 1px solid black;
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }
</style>