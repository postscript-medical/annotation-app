import type { Component } from 'svelte';
import type { Illustration } from '../catalogue/types.ts';

// What the sketchpad draws and remembers. The undo history is a list of these lists.

export type Point = { x: number; y: number };

/** Where the pointer is; `id` tracks one pointer through a stroke (see get-pointer-location). */
export type PointerLocation = Point & { id?: number };

export type SketchEvent = PointerEvent | TouchEvent;

export type EventNames = { down: string; move: string; up: string };

export type ShapeType = 'arrow' | 'ellipse' | 'rectangle';

export type StrokeAction = {
	name: 'pen' | 'eraser';
	action: string;
	index: number;
	lineWidth: number;
	color: string;
	points: Point[];
};

export type ShapeAction = {
	name: 'shape';
	index: number;
	type: ShapeType;
	x: number;
	y: number;
	dx: number;
	dy: number;
	lineWidth: number;
	color: string;
	/** Arrows only. */
	length?: number;
	angle?: number;
};

export type TextAction = {
	name: 'text';
	content: string;
	color: string;
	eventType: EventNames;
	index: number;
	x: number;
	y: number;
};

export type EraseAllAction = { name: 'erase-all'; index?: undefined };

/** Records which illustration this point in the history shows, so undo and redo can restore it. */
export type ChangeImageAction = {
	name: 'change-image';
	illustration: Illustration | null;
	index?: undefined;
};

export type SketchAction =
	StrokeAction | ShapeAction | TextAction | EraseAllAction | ChangeImageAction;

export type PenTool = { name: 'pen'; lineWidth: number; color: string };
export type EraserTool = { name: 'eraser'; lineWidth: number; color: string };
export type ShapeTool = { name: 'shape'; lineWidth: number; color: string; type: ShapeType };
export type SelectedTool = PenTool | EraserTool | ShapeTool;

/** An option in a tool's drawer: a size, or a shape. */
export type SecondaryTool = {
	id: string;
	value: number | string;
	// `any`: the size icons take a `size`, the shape and erase-all icons take nothing.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	component: Component<any>;
};

/** A typed-text drag: starting (with the box's size, to keep it on the paper) or ending. */
export type TextDrag =
	{ index: number; active: true; width: number; height: number } | { index: number; active: false };
