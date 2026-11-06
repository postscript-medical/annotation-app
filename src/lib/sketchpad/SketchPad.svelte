<!-- From legacy components/sketchpad. Browser only (reads `window` when created). -->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		actions,
		canvasElement,
		closeUserSettingsDropdown,
		selectedIllustration,
		selectedIllustrationTitle,
		toolDrawerOpen,
		typedTextEntries
	} from './stores.ts';
	import clone from './helpers/clone.ts';
	import getPointerLocation from './helpers/get-pointer-location.ts';
	import getUpdatedActions from './helpers/get-updated-actions.ts';
	import setupCanvas from './helpers/setup-canvas.ts';
	import typedText from './helpers/typed-text.ts';
	import {
		EVENTS_POINTER,
		EVENTS_TOUCH,
		LINE_THICKNESS_2,
		RADIAN,
		SHAPE_ARROW,
		TOOL_ARROW,
		TOOL_CHANGE_IMAGE,
		TOOL_ERASER,
		TOOL_ERASE_ALL,
		TOOL_ELLIPSE,
		TOOL_PEN,
		TOOL_RECTANGLE,
		TOOL_SHAPE,
		TOOL_TEXT
	} from './constants.ts';
	import { WATERMARK_URL } from '../images.ts';
	import type {
		PenTool,
		PointerLocation,
		SelectedTool,
		ShapeAction,
		ShapeTool,
		SketchAction,
		SketchEvent,
		StrokeAction,
		TextDrag
	} from './types.ts';
	import Illustration from './Illustration.svelte';
	import StokeCursor from './StokeCursor.svelte';
	import TypedTextEntry from './TypedTextEntry.svelte';

	type Props = {
		pen: PenTool;
		/** Null while typing text, which has no stroke. */
		selectedTool: SelectedTool | null;
		selectedToolId?: string;
		shape: ShapeTool;
	};

	let { pen, selectedTool, selectedToolId, shape }: Props = $props();

	export function clearCanvas() {
		clearRect();

		return $actions.current.filter(({ name }) => name !== TOOL_TEXT);
	}

	const hasPointer = !!window.PointerEvent;
	const eventType = hasPointer ? EVENTS_POINTER : EVENTS_TOUCH;

	// Only what the template shows is reactive; the rest is read by the event handlers.
	let context: CanvasRenderingContext2D;
	let actionsIndex = 0;
	let isPointerActive = $state(false);
	let dragTypedText: TextDrag = { index: 0, active: false };
	let offsetTop = 0;
	let offsetLeft = 0;
	let paper = $state<HTMLDivElement>();
	let pendingResize = false;
	let pointerLocation = $state.raw<PointerLocation>({ x: 0, y: 0 });
	let rafID = 0;

	function addShape(): ShapeAction {
		const { x, y } = pointerLocation;

		const newShape: ShapeAction = {
			name: TOOL_SHAPE,
			index: actionsIndex,
			type: shape.type,
			x: x - offsetLeft,
			y: y - offsetTop,
			dx: 0,
			dy: 0,
			lineWidth: LINE_THICKNESS_2,
			color: pen.color
		};

		// this causes every single click to add an entry to the array, potentially bloating it with empty entries
		// we should wait until the mouse has moved at least x pixels before adding an entry to the array
		isPointerActive = true;

		if (shape.type === TOOL_ARROW) {
			newShape.length = SHAPE_ARROW.length;
		}

		return newShape;
	}

	function addStroke(): StrokeAction {
		const tool = selectedTool!;

		// this causes every single click to add an entry to the array, potentially bloating it with empty entries
		// we should wait until the mouse has moved at least x pixels before adding an entry to the array
		isPointerActive = true;

		return {
			name: tool.name as StrokeAction['name'],
			action: tool.name,
			index: actionsIndex,
			lineWidth: tool.lineWidth,
			color: tool.color,
			points: []
		};
	}

	function clearRect() {
		context.clearRect(0, 0, $canvasElement!.width, $canvasElement!.height);
	}

	function dragText(event: Event) {
		event.preventDefault();

		recordPoint(event as SketchEvent);

		if (dragTypedText.active) {
			typedText.drag({
				stack: $actions.current,
				textbox: dragTypedText,
				x: pointerLocation.x - offsetLeft,
				y: pointerLocation.y - offsetTop
			});
		}
	}

	function drawStroke(
		_context: CanvasRenderingContext2D,
		{ name, lineWidth, color, points }: StrokeAction
	) {
		if (points.length < 3) return;

		const maxIndex = points.length - 2;
		const isDrawing = name === TOOL_PEN;

		_context.save();
		_context.globalCompositeOperation = isDrawing ? 'source-over' : 'destination-out';
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

	function drawShape(_context: CanvasRenderingContext2D, shape: ShapeAction) {
		_context.save();
		_context.lineWidth = shape.lineWidth;
		_context.strokeStyle = shape.color;

		switch (shape.type) {
			case TOOL_ARROW: {
				const length = shape.length ?? 0;
				const arrowHeadYLength = length < 100 ? length / 5 : 20;
				const arrowHeadXLength = length - arrowHeadYLength;

				_context.translate(shape.x, shape.y);
				_context.rotate(shape.angle ?? 0);
				_context.beginPath();
				_context.moveTo(0, 0);
				_context.lineTo(length, 0);
				_context.lineTo(arrowHeadXLength, arrowHeadYLength);
				_context.moveTo(length, 0);
				_context.lineTo(arrowHeadXLength, -arrowHeadYLength);
				_context.stroke();
				break;
			}

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
		}

		_context.restore();
	}

	function handleKeydown(event: KeyboardEvent) {
		const isZed = event.key === 'z';

		if ((event.metaKey || event.ctrlKey) && isZed) {
			undo();
		}

		if ((event.metaKey || event.ctrlKey) && event.shiftKey && isZed) {
			redo();
		}
	}

	function onPointerDown(event: Event) {
		event.preventDefault();

		(document.activeElement as HTMLElement | null)?.blur();

		toolDrawerOpen.set('');

		closeUserSettingsDropdown();

		// No tool chosen yet: nothing would be drawn, so don't record an empty action (and undo
		// step). Legacy recorded a pen stroke with no points here.
		if (!selectedToolId) return;

		recordPoint(event as SketchEvent);

		let newAction: SketchAction;

		switch (selectedToolId) {
			case TOOL_TEXT:
				newAction = typedText.add({
					color: pen.color,
					eventType,
					index: actionsIndex,
					x: pointerLocation.x - offsetLeft,
					y: pointerLocation.y - offsetTop
				});
				++actionsIndex;
				break;

			case TOOL_SHAPE:
				paper!.addEventListener(eventType.move, onPointerMove, false);

				newAction = addShape();
				break;

			default:
				paper!.addEventListener(eventType.move, onPointerMove, false);

				newAction = addStroke();
				break;
		}

		/**
		 * Only add an entry if we've drawn something or if
		 * we added a typed text entry
		 */
		actions.push([...clone($actions.current), newAction]);

		paper!.addEventListener(eventType.move, onPointerMove, false);

		render();
	}

	function onPointerUp() {
		paper!.removeEventListener(eventType.move, onPointerMove, false);

		resetPointerLocationId();

		stopDrawing();
	}

	function onPointerMove(event: Event) {
		event.preventDefault();

		recordPoint(event as SketchEvent);
	}

	function recordPoint(event: SketchEvent) {
		const location = getPointerLocation(event, { ...pointerLocation }, hasPointer);

		// Another pointer than the one drawing: ignore it.
		if (!location) return;

		pointerLocation = location;

		if (isPointerActive) {
			const targetIndex = $actions.current.findIndex(({ index }) => index === actionsIndex);
			const target = clone($actions.current[targetIndex]);

			if (target.name === TOOL_PEN || target.name === TOOL_ERASER) {
				target.points = [
					...target.points,
					{
						x: pointerLocation.x - offsetLeft,
						y: pointerLocation.y - offsetTop
					}
				];
			}

			if (target.name === TOOL_SHAPE) {
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
				}
			}

			/**
			 * Update current action... not add a new entry to the stack
			 */
			actions.update(getUpdatedActions(target, targetIndex));
		}
	}

	function render() {
		clearRect();

		context.lineCap = 'round';
		context.lineJoin = 'round';

		$actions.current.forEach((action) => {
			switch (action.name) {
				case TOOL_PEN:
				case TOOL_ERASER:
					drawStroke(context, action);
					break;

				case TOOL_ERASE_ALL:
					clearRect();
					break;

				case TOOL_SHAPE:
					drawShape(context, action);
					break;

				case TOOL_CHANGE_IMAGE:
					clearRect();
					selectedIllustrationTitle.set(action.illustrationTitle);
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
			id: undefined
		};
	}

	function resizeCanvas() {
		if (pendingResize) return;

		pendingResize = true;

		requestAnimationFrame(() => {
			// TODO: Investigate options for when the screen size ends up clipping the canvas due to the locked ratio
			const oldSize = {
				width: $canvasElement!.width,
				height: $canvasElement!.height
			};

			context = setupCanvas($canvasElement!);

			updateOffset();

			const scaleFactor = {
				width: $canvasElement!.width / oldSize.width,
				height: $canvasElement!.height / oldSize.height
			};

			const scaledStack: SketchAction[][] = [];
			const stackIndex = $actions.index;

			$actions.stack.forEach((entries) => {
				const scaledActions: SketchAction[] = [];

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

			pendingResize = false;

			render();
		});
	}

	// This is very costly. We should rethink how the resizing is handled
	function scaleAction(
		action: SketchAction,
		scaleFactor: { width: number; height: number }
	): SketchAction {
		switch (action.name) {
			case TOOL_PEN:
			case TOOL_ERASER:
				return {
					...action,
					points: action.points.map(({ x, y }) => {
						return {
							x: x * scaleFactor.width,
							y: y * scaleFactor.height
						};
					})
				};

			case TOOL_SHAPE: {
				const scaledShape: ShapeAction = {
					...action,
					x: action.x * scaleFactor.width,
					y: action.y * scaleFactor.height,
					dx: action.dx * scaleFactor.width,
					dy: action.dy * scaleFactor.height,
					lineWidth: action.lineWidth * scaleFactor.width
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
					y: action.y * scaleFactor.height
				};

			default:
				return {
					...action
				};
		}
	}

	function stopDrawing() {
		paper!.removeEventListener(eventType.move, onPointerMove, false);

		if (isPointerActive) ++actionsIndex;

		isPointerActive = false;
	}

	function toggleTypedTextDrag(drag: TextDrag) {
		dragTypedText = drag;

		resetPointerLocationId();

		if (drag.active) {
			paper!.addEventListener(eventType.move, dragText);

			const targetIndex = $actions.current.findIndex(({ index }) => index === dragTypedText.index);
			const target = {
				...$actions.current[targetIndex]
			};

			actions.push(getUpdatedActions(target, targetIndex));
		} else {
			paper!.removeEventListener(eventType.move, dragText);
		}
	}

	function updateOffset() {
		const boundingRect = $canvasElement!.getBoundingClientRect();
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
		const canvas = $canvasElement!;
		const surface = paper!;
		const viewport = window.visualViewport!;

		viewport.addEventListener('resize', resizeCanvas);
		document.body.addEventListener(eventType.up, stopDrawing, false);
		canvas.addEventListener(eventType.down, onPointerDown, false);
		canvas.addEventListener(eventType.up, onPointerUp, false);

		context = setupCanvas(canvas);

		actions.set([
			{
				name: TOOL_CHANGE_IMAGE,
				illustrationTitle: $selectedIllustrationTitle
			}
		]);

		resizeCanvas();

		return () => {
			document.body.removeEventListener(eventType.up, stopDrawing, false);
			canvas.removeEventListener(eventType.down, onPointerDown, false);
			canvas.removeEventListener(eventType.up, onPointerUp, false);
			surface.removeEventListener(eventType.move, onPointerMove, false);
			actions.set();

			viewport.removeEventListener('resize', resizeCanvas);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div bind:this={paper} class="paper shadow aspect-ratio-lock">
	{#if $selectedIllustration}
		<Illustration name={$selectedIllustration.src} />
	{/if}

	<canvas bind:this={$canvasElement} style={isPointerActive ? 'cursor: none;' : ''}></canvas>

	<div class="typed-text">
		{#each $typedTextEntries as entry (entry.index)}
			<TypedTextEntry
				content={entry.content}
				color={entry.color}
				eventType={entry.eventType}
				index={entry.index}
				x={entry.x}
				y={entry.y}
				onclose={(index) => typedText.remove({ stack: $actions.current, index })}
				ondrag={toggleTypedTextDrag}
				oninput={({ index, content }) =>
					typedText.updateContent({ stack: $actions.current, index, content })}
			/>
		{/each}
	</div>
	{#if isPointerActive && selectedTool}
		<StokeCursor position={pointerLocation} size={selectedTool.lineWidth} />
	{/if}

	<img src={WATERMARK_URL} class="watermark" width="85" height="71" alt="" />
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

	.watermark {
		display: none;
		position: absolute;
		left: 1rem;
		top: 1rem;
	}

	.typed-text {
		height: 100%;
		position: absolute;
		width: 100%;
		pointer-events: none;
		left: 0;
		top: 0;
	}

	@media print {
		.watermark {
			display: block;
		}

		.paper {
			box-shadow: none;
		}
	}
</style>
