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
    DEFAULT_COLOR_ID,
    DEFAULT_SIZE_ID,
    EVENTS_POINTER,
    EVENTS_TOUCH,
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    RADIAN,
    SHAPE_ARROW,
    TOOL_ARROW,
    TOOL_ERASER,
    TOOL_ELLIPSE,
    TOOL_PEN,
    TOOL_RECTANGLE,
    TOOL_TEXT,
  } from '../../constants/sketch-pad.js';
  import ImageSelectorButton from './ImageSelectorButton.svelte';
  import LogOutButton from '../LogOutButton.svelte';
  import SendEmailForm from '../SendEmailForm.svelte';
  import StokeCursor from './StokeCursor.svelte';
  import TypedTextEntry from './TypedTextEntry.svelte';

  const hasPointer = window.PointerEvent;
  const arrowIcon = new Image();
  // TODO: replace strokes with actions
  let actions = [];
  let canvas;
  let context;
  let encodedImage = '';
  let eraser = {
    name: TOOL_ERASER,
    lineWidth: ERASER_SIZES.find(({ id }) => id === DEFAULT_SIZE_ID).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR_ID).value,
  };
  let isPointerActive = false;
  let dragTypedText = { index: 0, active: false };
  let offsetTop = 0;
  let paper;
  let pen = {
    name: TOOL_PEN,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE_ID).value, 
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR_ID).value
  };
  let pointerLocation = { x: 0, y: 0 };
  let rafID;
  let selectedToolId;
  let selectedImageId;
  let shapes = [];
  let shapesIndex = 0;
  let showEmailForm = false;
  let strokes = [];
  let strokesIndex = 0;
  let typedText = [];
  let typedTextIndex = 0;


  $: eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;
  $: isErasing = selectedTool && selectedTool.name === TOOL_ERASER;
  $: selectedImage = gastroImages.find(({ id }) => id === selectedImageId);
  $: selectedTool = selectedToolId && selectedToolId === TOOL_PEN ? pen : eraser;
  $: src = selectedImage ? selectedImage.url : null;

  function addShape (shapeId, event) {
    const { x, y } = pointerLocation;

    let newShape = {
      id: shapeId,
      index: shapesIndex,
      x,
      y: y - offsetTop,
      dx: 0,
      dy: 0,
      lineWidth: pen.lineWidth,
      color: pen.color,
    };

    // this causes every single click to add an entry to the array, potentially bloating it with empty entries
    isPointerActive = true;

    if (shapeId === TOOL_ARROW) {
      newShape.src = arrowIcon;
      newShape.lenght = SHAPE_ARROW.length;
    };

    // this seems redundant as we're recording a point immediately after
    shapes = [
      ...shapes,
      newShape,
    ];

    recordPoint(event);

    render();
  };

  function addStroke (event) {
    // this causes every single click to add an entry to the array, potentially bloating it with empty entries
    isPointerActive = true;

    // this seems redundant as we're recording a point immediately after
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

  function closeModal () {
    showEmailForm = false;
  };

  function drawTypedText (parentBoundingRect, _context) {
    const entries = Array.from(paper.querySelectorAll('.typed-annotation'));
    _context.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
    _context.textBaseline = 'middle';
    entries.forEach(entry => {
      const boundingRect = entry.getBoundingClientRect();
      const x = boundingRect.x - parentBoundingRect.x + 7; /* 7 is the padding in the input */
      const y = boundingRect.y - parentBoundingRect.y + (boundingRect.height / 2);
      _context.fillStyle = 'black';
      _context.fillText(entry.value, x, y);
    });
  };

  function drawStrokes (_strokes, _context) {
    _strokes.forEach(({ action, lineWidth, color, points }) => {
      if (points.length < 3) return;

      const maxIndex = points.length - 2;
      const isDrawing = action === TOOL_PEN;

      _context.save();
      _context.globalCompositeOperation = isDrawing ? 'source-over' : 'destination-out';
      _context.strokeStyle = color;
      _context.beginPath();
      _context.lineWidth = lineWidth;
      _context.moveTo(points[0].x, points[0].y);

      for(let i = 1; i < maxIndex; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        _context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      _context.quadraticCurveTo(points[maxIndex].x, points[maxIndex].y, points[maxIndex+1].x, points[maxIndex+1].y);
      _context.stroke();
      _context.restore();
    });
  };

  function drawShapes (_shapes, _context) {
    if (shapes.length < 1) return;
    _shapes.forEach(shape => {
      _context.save();
      _context.lineWidth = shape.lineWidth;
      _context.strokeStyle = shape.color;

      switch (shape.id) {
          case TOOL_ARROW:
            _context.translate(shape.x, shape.y);
            _context.rotate(shape.angle);
            _context.drawImage(shape.src, 0, -(shape.length / 2), shape.length, shape.length);
            break;

          case TOOL_ELLIPSE:
          _context.translate(shape.x, shape.y);
          _context.beginPath();
          _context.ellipse(shape.dx, shape.dy, Math.abs(shape.dx), Math.abs(shape.dy), 0, 0, RADIAN);
          _context.stroke();
          break;

        case TOOL_RECTANGLE:
          _context.strokeRect(shape.x, shape.y, shape.dx, shape.dy);
          break;

        default:
          break;
      };

      _context.restore();
    });
  };

  function generateAnnotatedImage () {
    const _canvas = document.createElement('canvas');
    const _context = _canvas.getContext('2d');

    _canvas.width = canvas.width;
    _canvas.height = canvas.height;

    const srcImg = document.querySelector('#displayed-image');

    _context.fillStyle = 'white';
    _context.fillRect(0,0, _canvas.width, _canvas.height);
    _context.drawImage(srcImg, 0, 0, _canvas.width, _canvas.height);
    _context.drawImage(canvas, 0, 0);

    const boundingRect = canvas.getBoundingClientRect();
    drawTypedText(boundingRect, _context);

    return _canvas;
  };

  function init() {
    document.body.addEventListener(eventType.up, stopDrawing, false);
    canvas.addEventListener(eventType.down, onPointerDown, false);
    canvas.addEventListener(eventType.up, onPointerUp, false);
    paper.addEventListener(eventType.move, onPointerMove, false);

    context = setupCanvas(canvas);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    selectTool(TOOL_PEN);

    resizeCanvas();
  }

  function onPointerDown(event) {
    event.preventDefault();

    switch (selectedToolId) {
      case TOOL_TEXT:
        addTypedText(event);
        break;

      case TOOL_ARROW:
      case TOOL_ELLIPSE:
      case TOOL_RECTANGLE:
        addShape(selectedToolId, event);
        break;
    
      default:
        addStroke(event);
        break;
    };
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

    if (isPointerActive) {
      if (selectedToolId === TOOL_PEN || selectedToolId === TOOL_ERASER) {
        strokes[strokesIndex].points = [
          ...strokes[strokesIndex].points,
          {
            x: pointerLocation.x,
            y: pointerLocation.y - offsetTop,
          }
        ];

        return;
      };

      const targetIndex = shapes.findIndex(({ index }) => index === shapesIndex);
      let target = { ...shapes[targetIndex] };

      switch (selectedToolId) {
        case TOOL_ARROW:
          target.dx = pointerLocation.x - target.x;
          target.dy = pointerLocation.y - target.y;
          target.length = Math.sqrt(target.dx * target.dx + target.dy * target.dy);
          target.angle = Math.atan2(target.dy, target.dx);
          break;
        case TOOL_ELLIPSE:
          target.dx = (pointerLocation.x - target.x) / 2;
          target.dy = (pointerLocation.y - target.y) / 2;
          break;

        case TOOL_RECTANGLE:
          target.dx = pointerLocation.x - target.x;
          target.dy = pointerLocation.y - target.y - offsetTop;
          break;
      
        default:
          break;
      };

      shapes[targetIndex] = target;
      shapes = [...shapes];
    };
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
    if (isPointerActive) {
      switch (selectedToolId) {
        case TOOL_PEN:
        case TOOL_ERASER:
          ++strokesIndex;
          break;

        case TOOL_ARROW:
        case TOOL_ELLIPSE:
        case TOOL_RECTANGLE:
          ++shapesIndex;
          break;
      
        default:
          break;
      }
    };
    isPointerActive = false;
  };

  function selectTool (toolId) {
    if (toolId === TOOL_ARROW && !arrowIcon.src) {
      arrowIcon.src = SHAPE_ARROW.src;
    };

    selectedToolId = toolId;
  }

  function clearCanvas () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  function selectNewImage ({ detail: id }) {
    selectedImageId = id;
  };

  function openEmailForm () {
    const annotedImage = generateAnnotatedImage();
    encodedImage = annotedImage.toDataURL()
    showEmailForm = true;
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
    const annotedImage = generateAnnotatedImage();
    encodedImage = annotedImage.toDataURL('image/jpg', 0.7);
    const hiddenLink = document.createElement('a');

    hiddenLink.setAttribute('href', encodedImage);
    hiddenLink.setAttribute('download', 'myImage.jpg');
    hiddenLink.click();
  };

  function render () {
    clearCanvas();

    drawStrokes(strokes, context);

    drawShapes(shapes, context);

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
      on:click={ () => selectTool(TOOL_ERASER) }
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
          { size.id }
        </label>
      { /each }
    </form>
  </div>
  <div>
    <button
      on:click={ () => selectTool(TOOL_PEN) }
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
          { color.id }
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
          { size.id }
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
    <button
      on:click={ openEmailForm }
      disabled={ !selectedImage }
    >
      Share via email
    </button>
  </div>
  <div>
    <button
      on:click={ () => selectTool(TOOL_TEXT) }
    >
      Write
    </button>
    <button
      on:click={ () => selectTool(TOOL_ARROW) }
    >
      Arrow
    </button>
    <button
      on:click={ () => selectTool(TOOL_ELLIPSE) }
    >
      Ellipse
    </button>
    <button
      on:click={ () => selectTool(TOOL_RECTANGLE) }
    >
      Rectangle
    </button>
  </div>

  { #if isPointerActive && selectedTool }
    <StokeCursor
      position={ pointerLocation }
      size={ selectedTool.lineWidth }
    />
  { /if }
</div>

{ #if showEmailForm }
  <SendEmailForm
    { encodedImage }
    on:close={ closeModal }
  />
{ /if }


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