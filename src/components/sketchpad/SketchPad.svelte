<script>
  import {
    onDestroy,
    onMount,
  } from 'svelte';
  import {
    actions,
    canvas,
    context,
    illustrationsPath,
    selectedIllustration,
    typedTextEntries,
  } from '../../stores.js';
  import getPointerLocation from './helpers/get-pointer-location.js';
  import setupCanvas from './helpers/setup-canvas.js';
  import {
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    SHAPES,
    SHAPE_ARROW,
  } from '../../constants/sketch-pad.js';
  import {
    DEFAULT_COLOR,
    DEFAULT_SHAPE,
    DEFAULT_SIZE,
    EVENTS_POINTER,
    EVENTS_TOUCH,
    RADIAN,
    TOOL_ARROW,
    TOOL_ERASER,
    TOOL_ELLIPSE,
    TOOL_PEN,
    TOOL_RECTANGLE,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from '../../constants/defaults.js';
  import Illustration from './Illustration.svelte';
  import StokeCursor from './StokeCursor.svelte';
  import TypedTextEntry from './TypedTextEntry.svelte';

  export let pen;
  export let selectedTool;
  export let selectedToolId;
  export let shape;

  const hasPointer = window.PointerEvent;

  let actionsIndex = 0;
  let encodedImage = '';
  let isPointerActive = false;
  let dragTypedText = { index: 0, active: false };
  let offsetTop = 0;
  let offsetLeft = 0;
  let paper;
  let pointerLocation = { x: 0, y: 0 };
  let rafID;
  let selectedImageId;

  $: eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;
  $: src = $selectedIllustration ? $selectedIllustration.src : false;


  function addShape (shapeId, event) {
    const { x, y } = pointerLocation;

    let newShape = {
      name: shapeId,
      index: actionsIndex,
      src: shape.src,
      type: shape.type,
      x: x - offsetLeft,
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
      newShape.length = SHAPE_ARROW.length;
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
      color: pen.color,
      eventType,
      index: actionsIndex,
      x: pointerLocation.x - offsetLeft,
      y: pointerLocation.y - offsetTop,
    };
  };

  function clearCanvas () {
    $context.clearRect(0, 0, $canvas.width, $canvas.height);
  };

  function drawStroke (_context, { name, lineWidth, color, points }) {
      if (points.length < 3) return;

      const maxIndex = points.length - 2;
      const isDrawing = name === TOOL_PEN;

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
  };

  function drawShape (_context, shape) {
    _context.save();
    _context.lineWidth = shape.lineWidth;
    _context.strokeStyle = shape.color;

    switch (shape.type) {
      case TOOL_ARROW:
        let arrowHeadLength = shape.length < 100 ? shape.length / 5 : 20;

        _context.translate(shape.x, shape.y);
        _context.rotate(shape.angle);
        _context.beginPath();
        _context.moveTo(0,0);
        _context.lineTo(arrowHeadLength,arrowHeadLength);
        _context.moveTo(0,0);
        _context.lineTo(arrowHeadLength,-arrowHeadLength);
        _context.moveTo(0,0);
        _context.lineTo(shape.length, 0);
        _context.stroke();
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
  };

  function init() {
    document.body.addEventListener(eventType.up, stopDrawing, false);
    $canvas.addEventListener(eventType.down, onPointerDown, false);
    $canvas.addEventListener(eventType.up, onPointerUp, false);
    paper.addEventListener(eventType.move, onPointerMove, false);

    $context = setupCanvas($canvas);

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

    $actions = [
      ...$actions,
      newAction
    ];

    render();
  };

  function onPointerUp(event) {
    if (hasPointer && !isNaN(pointerLocation.id) && pointerLocation.id === event.pointerId) {
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

  function recordPoint (event) {
    const previousLocation = { ...pointerLocation };
    pointerLocation = getPointerLocation(event, previousLocation, hasPointer);

    if (!pointerLocation) {
      pointerLocation = { ...previousLocation };
      return;
    }

    if (isPointerActive) {
      const targetIndex = $actions.findIndex(({ index }) => index === actionsIndex);
      let target = { ...$actions[targetIndex] };

      if (selectedToolId === TOOL_PEN || selectedToolId === TOOL_ERASER) {
        target.points = [
          ...target.points,
          {
            x: pointerLocation.x - offsetLeft,
            y: pointerLocation.y - offsetTop,
          }
        ];
      };

      if (selectedToolId === TOOL_SHAPE) {
        switch (target.type) {
          case TOOL_ARROW:
          target.dx = pointerLocation.x - target.x - offsetLeft;
          target.dy = pointerLocation.y - target.y - offsetTop;
          target.length = Math.sqrt(target.dx * target.dx + target.dy * target.dy);
          target.angle = Math.atan2(target.dy, target.dx);
          break;

        case TOOL_ELLIPSE:
          target.dx = (pointerLocation.x - target.x - offsetLeft) / 2;
          target.dy = (pointerLocation.y - target.y - offsetTop) / 2;
          break;

        case TOOL_RECTANGLE:
          target.dx = pointerLocation.x - target.x - offsetLeft;
          target.dy = pointerLocation.y - target.y - offsetTop;
          break;
      
        default:
          break;
        };
      };

      $actions[targetIndex] = target;
      $actions = [...$actions];
    };
  };

  function render () {
    clearCanvas();

    $context.lineCap = 'round';
    $context.lineJoin = 'round';

    $actions.forEach(action => {
      switch (action.name) {
        case TOOL_PEN:
        case TOOL_ERASER:
          drawStroke($context, action);
          break;

        case TOOL_SHAPE:
          drawShape($context, action);
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
    const oldSize = { width: $canvas.width, height: $canvas.height };

    $context = setupCanvas($canvas);

    updateOffset();

    const scaleFactor = { width: $canvas.width / oldSize.width, height: $canvas.height / oldSize.height };

    $actions = $actions.map(action => {
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

  function toggleTypedTextDrag ({ detail }) {
    dragTypedText = detail;
  }; 

  function typedTextDragBox () {
      const targetIndex = $actions.findIndex(({ index }) => index === dragTypedText.index);
      // TODO: Convert this coordinates to percentages to take advantage of CSS positioning and remove the loop in the resize call
      let target = {
        ...$actions[targetIndex],
        x: pointerLocation.x - offsetLeft,
        y: pointerLocation.y - offsetTop,
      };

      $actions[targetIndex] = target;
      $actions = [...$actions];
  };

  function typedTexRemovetEntry ({ detail }) {
    const targetIndex = $actions.findIndex(({ index }) => index === detail.index);
    let target = [...$actions];

    target.splice(targetIndex, 1);

    $actions = target;
  };

  function typedTextUpdateEntryContent ({ detail }) {
    const targetIndex = $actions.findIndex(({ index }) => index === detail.index);
    let target = {
        ...$actions[targetIndex],
        content: detail.content,
      };

    $actions[targetIndex] = target;
    $actions = [...$actions];
  };

  function updateOffset () {
    const boundingRect = $canvas.getBoundingClientRect();
    offsetTop = boundingRect.top;
    offsetLeft = boundingRect.left;
  };

  onMount(() => {
    init();
  });

  onDestroy(() => {
    document.body.removeEventListener(eventType.up, stopDrawing, false);
    $canvas.removeEventListener(eventType.down, onPointerDown, false);
    $canvas.removeEventListener(eventType.up, onPointerUp, false);
    paper.removeEventListener(eventType.move, onPointerMove, false);
  });
</script>

<svelte:window
  on:resize={ resizeCanvas }
/>

<div
  bind:this={ paper }
  class="paper shadow aspect-ratio-lock"
>
  { #if src }
    <Illustration
      { src }
    />
  { /if }

  <canvas
    bind:this={ $canvas }
    style={ isPointerActive ? 'cursor: none;' : '' }
  ></canvas>

  <div
    class="typed-text"
  >
    { #each $typedTextEntries as entry (entry.index) }
      <TypedTextEntry
        { ...entry }
        on:close={ typedTexRemovetEntry }
        on:drag={ toggleTypedTextDrag }
        on:input={ typedTextUpdateEntryContent }
      />
    { /each }
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
    position: absolute;
    left: 0;
    top: 0;
    cursor: crosshair;
    width: 100%;
    height: 100%;
  }

  .paper {
    background: white;
    position: relative;
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .typed-text {
    height: 100%;
    position: absolute;
    width: 100%;
    pointer-events: none;
    left: 0;
    top: 0;
  }
</style>