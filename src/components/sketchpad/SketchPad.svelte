<script>
  import { onDestroy, onMount } from "svelte";
  import {
    actions,
    canvasElement,
    context,
    dpr,
    selectedIllustration,
    selectedIllustrationTitle,
    toolDrawerOpen,
    typedTextEntries,
  } from "../../stores.js";
  import clone from "../../methods/clone.js";
  import closeUserSettingsDropdown from "../../methods/closeUserSettingsDropdown.js";
  import getPointerLocation from "./helpers/get-pointer-location.js";
  import setupCanvas from "./helpers/setup-canvas.js";
  import { SHAPE_ARROW } from "../../constants/sketch-pad.js";
  import {
    EVENTS_POINTER,
    EVENTS_TOUCH,
    LINE_THICKNESS_2,
    RADIAN,
    TOOL_ARROW,
    TOOL_CHANGE_IMAGE,
    TOOL_ERASER,
    TOOL_ERASE_ALL,
    TOOL_ELLIPSE,
    TOOL_PEN,
    TOOL_RECTANGLE,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from "../../constants/defaults.js";
  import Illustration from "./Illustration.svelte";
  import StokeCursor from "./StokeCursor.svelte";
  import TypedTextEntry from "./TypedTextEntry.svelte";

  export let pen;
  export let selectedTool;
  export let selectedToolId;
  export let shape;

  const hasPointer = window.PointerEvent;

  let actionsIndex = 0;
  let isPointerActive = false;
  let dragTypedText = { index: 0, active: false };
  let offsetTop = 0;
  let offsetLeft = 0;
  let paper;
  let pointerLocation = { x: 0, y: 0 };
  let rafID;

  $: eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;
  $: src = $selectedIllustration ? $selectedIllustration.src : false;

  function addShape(shapeId) {
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
      lineWidth: LINE_THICKNESS_2,
      color: pen.color,
    };

    // this causes every single click to add an entry to the array, potentially bloating it with empty entries
    // we should wait until the mouse has moved at least x pixels before adding an entry to the array
    isPointerActive = true;

    if (shape.type === TOOL_ARROW) {
      newShape.length = SHAPE_ARROW.length;
    }

    return newShape;
  }

  function addStroke() {
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
  }

  function addTypedText() {
    return {
      name: TOOL_TEXT,
      content: "",
      color: pen.color,
      eventType,
      index: actionsIndex,
      x: pointerLocation.x - offsetLeft,
      y: pointerLocation.y - offsetTop,
    };
  }

  export function clearCanvas() {
    clearRect();

    actions.push([
      ...clone($actions.current),
      {
        name: TOOL_ERASE_ALL,
      },
    ]);
  }

  function clearRect() {
    $context.clearRect(0, 0, $canvasElement.width, $canvasElement.height);
  }

  function drawStroke(_context, { name, lineWidth, color, points }) {
    if (points.length < 3) return;

    const maxIndex = points.length - 2;
    const isDrawing = name === TOOL_PEN;

    _context.save();
    _context.globalCompositeOperation = isDrawing
      ? "source-over"
      : "destination-out";
    _context.strokeStyle = color;
    _context.beginPath();
    _context.lineWidth = lineWidth;
    _context.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < maxIndex; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      _context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    _context.quadraticCurveTo(
      points[maxIndex].x,
      points[maxIndex].y,
      points[maxIndex + 1].x,
      points[maxIndex + 1].y
    );
    _context.stroke();
    _context.restore();
  }

  function drawShape(_context, shape) {
    _context.save();
    _context.lineWidth = shape.lineWidth;
    _context.strokeStyle = shape.color;

    switch (shape.type) {
      case TOOL_ARROW: {
        const arrowHeadYLength = shape.length < 100 ? shape.length / 5 : 20;
        const arrowHeadXLength = shape.length - arrowHeadYLength;

        _context.translate(shape.x, shape.y);
        _context.rotate(shape.angle);
        _context.beginPath();
        _context.moveTo(0, 0);
        _context.lineTo(shape.length, 0);
        _context.lineTo(arrowHeadXLength, arrowHeadYLength);
        _context.moveTo(shape.length, 0);
        _context.lineTo(arrowHeadXLength, -arrowHeadYLength);
        _context.stroke();
        break;
      }

      case TOOL_ELLIPSE:
        _context.translate(shape.x, shape.y);
        _context.beginPath();

        if (_context.ellipse) {
          // IE does not support ellipse path command in Canvas
          _context.ellipse(
            shape.dx,
            shape.dy,
            Math.abs(shape.dx),
            Math.abs(shape.dy),
            0,
            0,
            RADIAN
          );
        } else {
          _context.arc(
            shape.dx,
            shape.dy,
            Math.sqrt(
              shape.dx * shape.dx + shape.dy * shape.dy
            ) /* hypotenuse */,
            0,
            6.283185
          );
        }

        _context.stroke();
        break;

      case TOOL_RECTANGLE:
        _context.strokeRect(shape.x, shape.y, shape.dx, shape.dy);
        break;

      default:
        break;
    }

    _context.restore();
  }

  function handleKeydown(event) {
    const isZed = event.key === "z";

    if ((event.metaKey || event.ctrlKey) && isZed) {
      undo();
    }

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && isZed) {
      redo();
    }
  }

  function init() {
    document.body.addEventListener(eventType.up, stopDrawing, false);
    $canvasElement.addEventListener(eventType.down, onPointerDown, false);
    $canvasElement.addEventListener(eventType.up, onPointerUp, false);
    paper.addEventListener(eventType.move, onPointerMove, false);

    $context = setupCanvas($canvasElement);

    actions.set([
      {
        name: TOOL_CHANGE_IMAGE,
        illustrationTitle: $selectedIllustrationTitle,
      },
    ]);

    resizeCanvas();
  }

  function onPointerDown(event) {
    event.preventDefault();

    document.activeElement.blur();

    toolDrawerOpen.set("");

    closeUserSettingsDropdown();

    recordPoint(event);

    let newAction = {};

    switch (selectedToolId) {
      case TOOL_TEXT:
        newAction = addTypedText();
        ++actionsIndex;
        break;

      case TOOL_SHAPE:
        newAction = addShape(selectedToolId);
        break;

      default:
        newAction = addStroke();
        break;
    }

    /**
     * Only add an entry if we've drawn something or if
     * we added a typed text entry
     */
    actions.push([...clone($actions.current), newAction]);

    render();
  }

  function onPointerUp() {
    resetPointerLocationId();

    stopDrawing();
  }

  function onPointerMove(event) {
    event.preventDefault();

    recordPoint(event);

    if (dragTypedText.active) {
      typedTextDragBox();
    }
  }

  function recordPoint(event) {
    const previousLocation = { ...pointerLocation };
    pointerLocation = getPointerLocation(event, previousLocation, hasPointer);

    if (!pointerLocation) {
      pointerLocation = { ...previousLocation };
      return;
    }

    if (isPointerActive) {
      const targetIndex = $actions.current.findIndex(
        ({ index }) => index === actionsIndex
      );
      let target = clone($actions.current[targetIndex]);

      if (selectedToolId === TOOL_PEN || selectedToolId === TOOL_ERASER) {
        target.points = [
          ...target.points,
          {
            x: pointerLocation.x - offsetLeft,
            y: pointerLocation.y - offsetTop,
          },
        ];
      }

      if (selectedToolId === TOOL_SHAPE) {
        switch (target.type) {
          case TOOL_ARROW:
            target.dx = pointerLocation.x - target.x - offsetLeft;
            target.dy = pointerLocation.y - target.y - offsetTop;
            target.length = Math.sqrt(
              target.dx * target.dx + target.dy * target.dy
            );
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
        }
      }

      /**
       * Update current action... not add a new entry to the stack
       */
      updateCurrentAction(target, targetIndex);
    }
  }

  function render() {
    clearRect();

    $context.lineCap = "round";
    $context.lineJoin = "round";

    $actions.current.forEach((action) => {
      switch (action.name) {
        case TOOL_PEN:
        case TOOL_ERASER:
          drawStroke($context, action);
          break;

        case TOOL_ERASE_ALL:
          clearRect();
          break;

        case TOOL_SHAPE:
          drawShape($context, action);
          break;

        case TOOL_CHANGE_IMAGE:
          $selectedIllustrationTitle = action.illustrationTitle;
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
  }

  function resetPointerLocationId() {
    pointerLocation = {
      ...pointerLocation,
      id: undefined,
    };
  }

  function resizeCanvas() {
    // TODO: Investigate options for when the screen size ends up clipping the canvas due to the locked ratio
    const oldSize = {
      width: $canvasElement.width,
      height: $canvasElement.height,
    };

    $context = setupCanvas($canvasElement);

    updateOffset();

    const scaleFactor = {
      width: $canvasElement.width / oldSize.width,
      height: $canvasElement.height / oldSize.height,
    };

    const scaledStack = [];
    const stackIndex = $actions.index;

    $actions.stack.forEach((entries) => {
      const scaledActions = [];

      scaledStack.push(scaledActions);

      entries.forEach((entry) => {
        scaledActions.push(scaleAction(entry, scaleFactor));
      });
    });

    actions.set();

    scaledStack.forEach((action) => {
      actions.push(action);
    });

    actions.jumpTo(stackIndex);

    render();
  }

  // This is very costly. We should rethink how the resizing is handled
  function scaleAction(action, scaleFactor) {
    switch (action.name) {
      case TOOL_PEN:
      case TOOL_ERASER:
        return {
          ...action,
          points: action.points.map(({ x, y }) => {
            return {
              x: x * scaleFactor.width,
              y: y * scaleFactor.height,
            };
          }),
        };

      case TOOL_SHAPE: {
        const scaledShape = {
          ...action,
          x: action.x * scaleFactor.width,
          y: action.y * scaleFactor.height,
          dx: action.dx * scaleFactor.width,
          dy: action.dy * scaleFactor.height,
          lineWidth: action.lineWidth * scaleFactor.width,
        };

        if (action.type === TOOL_ARROW) {
          scaledShape.length = Math.sqrt(
            scaledShape.dx * scaledShape.dx + scaledShape.dy * scaledShape.dy
          );
          scaledShape.angle = Math.atan2(scaledShape.dy, scaledShape.dx);
        }

        return scaledShape;
      }

      case TOOL_TEXT:
        return {
          ...action,
          x: action.x * scaleFactor.width,
          y: action.y * scaleFactor.height,
        };

      default:
        return {
          ...action,
        };
    }
  }

  function stopDrawing() {
    if (isPointerActive) ++actionsIndex;

    isPointerActive = false;
  }

  function toggleTypedTextDrag({ detail: drag }) {
    dragTypedText = drag;

    resetPointerLocationId();

    if (drag.active) {
      const targetIndex = $actions.current.findIndex(
        ({ index }) => index === dragTypedText.index
      );
      const target = {
        ...$actions.current[targetIndex],
      };

      updateActions(target, targetIndex);
    }
  }

  function typedTextDragBox() {
    const targetIndex = $actions.current.findIndex(
      ({ index }) => index === dragTypedText.index
    );
    const scaledWidth = $canvasElement.width / $dpr;
    const scaledHeight = $canvasElement.height / $dpr;
    // TODO: Convert this coordinates to percentages to take advantage of CSS positioning and remove the loop in the resize call
    let target = {
      ...$actions.current[targetIndex],
      x: pointerLocation.x - offsetLeft,
      y: pointerLocation.y - offsetTop,
    };

    // work out if box is going to be outside the paper boundaries
    if (target.x < 0) {
      target.x = 0;
    }

    if (target.x + dragTypedText.width > scaledWidth) {
      target.x = scaledWidth - dragTypedText.width;
    }

    if (target.y < 0) {
      target.y = 0;
    }

    if (target.y + dragTypedText.height > scaledHeight) {
      target.y = scaledHeight - dragTypedText.height;
    }

    updateCurrentAction(target, targetIndex);
  }

  function typedTexRemovetEntry({ detail }) {
    const targetIndex = $actions.current.findIndex(
      ({ index }) => index === detail.index
    );
    let updatedActions = clone($actions.current);

    updatedActions.splice(targetIndex, 1);

    actions.push(updatedActions);
  }

  function typedTextUpdateEntryContent({ detail }) {
    const targetIndex = $actions.current.findIndex(
      ({ index }) => index === detail.index
    );
    let newAction = {
      ...clone($actions.current[targetIndex]),
      content: detail.content,
    };

    updateActions(newAction, targetIndex);
  }

  function updateActions(updatedAction, index) {
    const updatedActions = clone($actions.current);
    updatedActions[index] = updatedAction;

    actions.push(updatedActions);
  }

  function updateCurrentAction(updatedAction, index) {
    const updatedActions = clone($actions.current);
    updatedActions[index] = updatedAction;

    actions.update(updatedActions);
  }

  function updateOffset() {
    const boundingRect = $canvasElement.getBoundingClientRect();
    offsetTop = boundingRect.top;
    offsetLeft = boundingRect.left;
  }

  export function undo() {
    actions.undo();
    render();
  }

  export function redo() {
    actions.redo();
    render();
  }

  onMount(() => {
    init();
  });

  onDestroy(() => {
    document.body.removeEventListener(eventType.up, stopDrawing, false);
    $canvasElement.removeEventListener(eventType.down, onPointerDown, false);
    $canvasElement.removeEventListener(eventType.up, onPointerUp, false);
    paper.removeEventListener(eventType.move, onPointerMove, false);
    actions.set();
  });
</script>

<svelte:window on:resize={resizeCanvas} on:keydown={handleKeydown} />

<div bind:this={paper} class="paper shadow aspect-ratio-lock">
  {#if src}
    <Illustration {src} />
  {/if}

  <canvas
    bind:this={$canvasElement}
    style={isPointerActive ? "cursor: none;" : ""}
  />

  <div class="typed-text">
    {#each $typedTextEntries as entry (entry.index)}
      <TypedTextEntry
        {...entry}
        on:close={typedTexRemovetEntry}
        on:drag={toggleTypedTextDrag}
        on:input={typedTextUpdateEntryContent}
      />
    {/each}
  </div>
  {#if isPointerActive && selectedTool}
    <StokeCursor position={pointerLocation} size={selectedTool.lineWidth} />
  {/if}
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
