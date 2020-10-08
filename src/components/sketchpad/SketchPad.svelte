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
    DEFAULT_SHAPE_ID,
    DEFAULT_SIZE_ID,
    EVENTS_POINTER,
    EVENTS_TOUCH,
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    RADIAN,
    SHAPES,
    SHAPE_ARROW,
    TOOL_ARROW,
    TOOL_ERASER,
    TOOL_ELLIPSE,
    TOOL_PEN,
    TOOL_RECTANGLE,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from '../../constants/sketch-pad.js';
  import ColorPalette from './ColorPalette.svelte';
  import ImageSelectorButton from './ImageSelectorButton.svelte';
  import LogOutButton from '../LogOutButton.svelte';
  import ToolButton from './ToolButton.svelte';
  import SendEmailForm from '../SendEmailForm.svelte';
  import StokeCursor from './StokeCursor.svelte';
  import TypedTextEntry from './TypedTextEntry.svelte';

  const arrowIcon = new Image();
  const dpr = window.devicePixelRatio || 1;
  const hasPointer = window.PointerEvent;

  let actions = [];
  let actionsIndex = 0;
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
  let selectedTool;
  let selectedToolId;
  let selectedImageId;
  let shape = {
    name: TOOL_SHAPE,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE_ID).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR_ID).value,
    type: SHAPES.find(({ id }) => id === DEFAULT_SHAPE_ID).id,
  };
  let showEmailForm = false;


  $: eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;
  $: selectedImage = gastroImages.find(({ id }) => id === selectedImageId);
  $: src = selectedImage ? selectedImage.url : null;
  $: typedTextEntries = actions.filter(({ name }) => name === TOOL_TEXT);
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
  }

  function addShape (shapeId, event) {
    const { x, y } = pointerLocation;

    let newShape = {
      name: shapeId,
      index: actionsIndex,
      type: shape.type,
      x,
      y: y - offsetTop,
      dx: 0,
      dy: 0,
      lineWidth: pen.lineWidth,
      color: pen.color,
    };

    // this causes every single click to add an entry to the array, potentially bloating it with empty entries
    // we should wait until the mouse has moved at least x pixels before adding an entry to the array
    isPointerActive = true;

    if (shape.type === TOOL_ARROW) {
      newShape.src = arrowIcon;
      newShape.lenght = SHAPE_ARROW.length;
    };

    return newShape;
  };

  function addStroke (event) {
    // this causes every single click to add an entry to the array, potentially bloating it with empty entries
    // we should wait until the mouse has moved at least x pixels before adding an entry to the array
    isPointerActive = true;

    return {
      name: selectedTool.name,
      action: selectedTool.name,
      index: actionsIndex,
      lineWidth: selectedTool.lineWidth,
      color: selectedTool.color,
      points: [],
    };
  };

  function addTypedText (event) {
    return {
      name: TOOL_TEXT,
      content: '',
      eventType,
      index: actionsIndex,
      x: pointerLocation.x,
      y: pointerLocation.y - offsetTop,
    };
  };

  function clearCanvas () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  // TODO: This should be in the modal component
  function closeModal () {
    showEmailForm = false;
  };

  function changePenColor (color) {
    pen = {
      ...pen,
      color,
    };
    console.log('changePenColor', color);
  };

  function changeLineThickness (thickness, tool) {
    if (tool === TOOL_PEN) {
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

  function changeShapeType (type) {
    shape = {
      ...shape,
      type,
    }
  };

  function downloadImage () {
    const annotedImage = generateAnnotatedImage();
    encodedImage = annotedImage.toDataURL('image/jpg', 0.7);
    const hiddenLink = document.createElement('a');

    hiddenLink.setAttribute('href', encodedImage);
    hiddenLink.setAttribute('download', 'myImage.jpg');
    hiddenLink.click();
  };

  function drawTypedText (parentBoundingRect, _context) {
    const entries = Array.from(paper.querySelectorAll('.typed-annotation'));
    const fontSize = `${16 * dpr}px`;
    
    _context.font = `${fontSize} 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
    _context.textBaseline = 'middle';

    entries.forEach(entry => {
      const boundingRect = entry.getBoundingClientRect();
      const x = (boundingRect.x - parentBoundingRect.x + 7) * dpr; /* 7 is the padding in the input */
      const y = (boundingRect.y - parentBoundingRect.y + (boundingRect.height / 2)) * dpr;

      console.log('drawTypedText x:', x, '| y:', y);
      console.log('bounding x:', boundingRect.x, '| y:', boundingRect.y);
      console.log('parent x:', parentBoundingRect.x, '| y:', parentBoundingRect.y);

      _context.fillStyle = 'black';
      _context.fillText(entry.value, x, y);
    });
  };

  function drawStroke ({ name, lineWidth, color, points }) {
      if (points.length < 3) return;

      const maxIndex = points.length - 2;
      const isDrawing = name === TOOL_PEN;

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

      context.quadraticCurveTo(points[maxIndex].x, points[maxIndex].y, points[maxIndex+1].x, points[maxIndex+1].y);
      context.stroke();
      context.restore();
  };

  function drawShape (shape) {
    context.save();
    context.lineWidth = shape.lineWidth;
    context.strokeStyle = shape.color;

    switch (shape.type) {
      case TOOL_ARROW:
        context.translate(shape.x, shape.y);
        context.rotate(shape.angle);
        context.drawImage(shape.src, 0, -(shape.length / 2), shape.length, shape.length);
        break;

      case TOOL_ELLIPSE:
        context.translate(shape.x, shape.y);
        context.beginPath();
        context.ellipse(shape.dx, shape.dy, Math.abs(shape.dx), Math.abs(shape.dy), 0, 0, RADIAN);
        context.stroke();
        break;

      case TOOL_RECTANGLE:
        context.strokeRect(shape.x, shape.y, shape.dx, shape.dy);
        break;

      default:
        break;
    };

    context.restore();
  };

  function eraseAll () {
    clearCanvas();
    actions = [];
  };

  function generateAnnotatedImage () {
    const _canvas = document.createElement('canvas');
    const _context = _canvas.getContext('2d');
    const _srcImg = document.querySelector('#displayed-image');
    const _boundingRect = canvas.getBoundingClientRect();

    _canvas.width = canvas.width;
    _canvas.height = canvas.height;

    _context.fillStyle = 'white';
    _context.fillRect(0,0, _canvas.width, _canvas.height);
    _context.drawImage(_srcImg, 0, 0, _canvas.width, _canvas.height);
    _context.drawImage(canvas, 0, 0);

    drawTypedText(_boundingRect, _context);

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
  };

  function onPointerDown(event) {
    event.preventDefault();

    recordPoint(event);

    let newAction = {};

    switch (selectedToolId) {
      case TOOL_TEXT:
        newAction = addTypedText(event);
        ++actionsIndex;
        break;

      case TOOL_SHAPE:
        newAction = addShape(selectedToolId, event);
        break;
    
      default:
        newAction = addStroke(event);
        break;
    };

    actions = [
      ...actions,
      newAction
    ];

    render();
  };

  function onPointerUp(event) {
    if (hasPointer && pointerLocation.id && pointerLocation.id === event.pointerId) {
      pointerLocation = {
        ...pointerLocation,
        id: undefined,
      };
    };
    stopDrawing();
  };

  function onPointerMove(event) {
    event.preventDefault();

    recordPoint(event);

    if (dragTypedText.active) {
      typedTextDragBox();
    };
  };

  function openEmailForm () {
    const annotedImage = generateAnnotatedImage();
    encodedImage = annotedImage.toDataURL()
    showEmailForm = true;
  };

  function recordPoint (event) {
    const previousLocation = { ...pointerLocation };
    pointerLocation = getPointerLocation(event, previousLocation, hasPointer);

    if (!pointerLocation) {
      pointerLocation = { ...previousLocation };
      return;
    }

    if (isPointerActive) {
      const targetIndex = actions.findIndex(({ index }) => index === actionsIndex);
      let target = { ...actions[targetIndex] };

      if (selectedToolId === TOOL_PEN || selectedToolId === TOOL_ERASER) {
        target.points = [
          ...target.points,
          {
            x: pointerLocation.x,
            y: pointerLocation.y - offsetTop,
          }
        ];
      };

      if (selectedToolId === TOOL_SHAPE) {
        switch (target.type) {
          case TOOL_ARROW:
          target.dx = pointerLocation.x - target.x;
          target.dy = pointerLocation.y - target.y - offsetTop;
          target.length = Math.sqrt(target.dx * target.dx + target.dy * target.dy);
          target.angle = Math.atan2(target.dy, target.dx);
          break;

        case TOOL_ELLIPSE:
          target.dx = (pointerLocation.x - target.x) / 2;
          target.dy = (pointerLocation.y - target.y - offsetTop) / 2;
          break;

        case TOOL_RECTANGLE:
          target.dx = pointerLocation.x - target.x;
          target.dy = pointerLocation.y - target.y - offsetTop;
          break;
      
        default:
          break;
        };
      };

      actions[targetIndex] = target;
      actions = [...actions];
    };
  };

  function render () {
    clearCanvas();

    actions.forEach(action => {
      switch (action.name) {
        case TOOL_PEN:
        case TOOL_ERASER:
          drawStroke(action);
          break;

        case TOOL_SHAPE:
          drawShape(action);
          break;
      
        default:
          break;
      }
    });

    if (isPointerActive) {
      rafID = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(rafID);
    }
  };

  function resizeCanvas () {
    // TODO: Investigate options for when the screen size ends up clipping the canvas due to the locked ratio
    const oldSize = { width: canvas.width, height: canvas.height };

    context = setupCanvas(canvas);

    updateOffsetTop();

    const scaleFactor = { width: canvas.width / oldSize.width, height: canvas.height / oldSize.height };

    actions = actions.map(action => {
      switch (action.name) {
        case TOOL_PEN:
        case TOOL_ERASER:
          return {
            ...action,
            points: action.points.map(({ x, y, lineWidth }) => {
              return {
                x: x * scaleFactor.width,
                y: y * scaleFactor.height,
                lineWidth: lineWidth * scaleFactor.width,
              };
            })
          };

        case TOOL_SHAPE:
          const scaledShape = {
            ...action,
            x: action.x * scaleFactor.width,
            y: action.y * scaleFactor.height,
            dx: action.dx * scaleFactor.width,
            dy: action.dy * scaleFactor.height,
            lineWidth: action.lineWidth * scaleFactor.width,
          };

          if (action.type === TOOL_ARROW) {
            scaledShape.length = Math.sqrt(scaledShape.dx * scaledShape.dx + scaledShape.dy * scaledShape.dy);
            scaledShape.angle = Math.atan2(scaledShape.dy, scaledShape.dx);
          };

          return scaledShape;

        case TOOL_TEXT:
          return {
            ...action,
            x: action.x * scaleFactor.width,
            y: action.y * scaleFactor.height,
          }
      }
    });

    render();
  };

  function stopDrawing () {
    if (isPointerActive) ++actionsIndex;

    isPointerActive = false;
  };

  function selectTool (toolId) {
    if (toolId === TOOL_SHAPE && !arrowIcon.src) {
      arrowIcon.src = SHAPE_ARROW.src;
    };

    selectedToolId = toolId;
  }

  function selectNewImage ({ detail: id }) {
    selectedImageId = id;
  };

  function toggleTypedTextDrag ({ detail }) {
    dragTypedText = detail;
  }; 

  function typedTextDragBox () {
      const targetIndex = actions.findIndex(({ index }) => index === dragTypedText.index);
      // TODO: Convert this coordinates to percentages to take advantage of CSS positioning and remove the loop in the resize call
      let target = {
        ...actions[targetIndex],
        x: pointerLocation.x,
        y: pointerLocation.y - offsetTop,
      };

      actions[targetIndex] = target;
      actions = [...actions];
  };

  function typedTexRemovetEntry ({ detail }) {
    const targetIndex = actions.findIndex(({ index }) => index === detail.index);
    let target = [...actions];

    target.splice(targetIndex, 1);

    actions = target;
  };

  function typedTextUpdateEntryContent ({ detail }) {
    const targetIndex = actions.findIndex(({ index }) => index === detail.index);
    let target = {
        ...actions[targetIndex],
        content: detail.content,
      };

    actions[targetIndex] = target;
    actions = [...actions];
  };

  function updateOffsetTop () {
    offsetTop = canvas.getBoundingClientRect().top;
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
  on:resize={ resizeCanvas }
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

  <div
    class="typed-text"
  >
    { #each typedTextEntries as entry (entry.index) }
      <TypedTextEntry
        { ...entry }
        on:close={ typedTexRemovetEntry }
        on:drag={ toggleTypedTextDrag }
        on:input={ typedTextUpdateEntryContent }
      />
    { /each }
  </div>
</div>

<div
  class="ui"
>
  <div>
    <span>User is: { $user.email }</span>
    <LogOutButton />
  </div>
  <div>
    <button
      on:click={ eraseAll }
    >
      Erase all
    </button>
  </div>
  <div>
    <ToolButton
      primaryValue={ selectedToolId }
      toolName={ TOOL_PEN }
      secondaryTools={ PEN_SIZES }
      secondaryValue={ pen.lineWidth }
      on:change-primary={ ({ detail }) => selectTool(detail) }
      on:change-secondary={ ({ detail }) => changeLineThickness(detail, TOOL_PEN) }
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
      on:change-primary={ ({ detail }) => selectTool(detail) }
      on:change-secondary={ ({ detail }) => changeLineThickness(detail, TOOL_ERASER) }
    >
      <span>
        E
      </span>
    </ToolButton>

    <ToolButton
      primaryValue={ selectedToolId }
      toolName={ TOOL_SHAPE }
      secondaryTools={ SHAPES }
      secondaryValue={ shape.type }
      on:change-primary={ ({detail}) => selectTool(detail) }
      on:change-secondary={ ({ detail }) => changeShapeType(detail) }
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
      on:change={ ({ detail }) => changePenColor(detail) }
    />
  </div>
  <div>
    <p>Color</p>
    <ImageSelectorButton
      options={ gastroImages }
      on:update={ selectNewImage 
      }
    />
  </div>
  <div>
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
    position: absolute;
    left: 0;
    top: 0;
    cursor: crosshair;
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