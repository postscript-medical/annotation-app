import { get } from 'svelte/store';
import { TOOL_TEXT } from '../constants.ts';
import { actions, canvasElement, dpr } from '../stores.ts';
import type { EventNames, SketchAction, TextAction } from '../types.ts';
import clone from './clone.ts';
import getUpdatedActions from './get-updated-actions.ts';

// Ported from legacy `components/sketchpad/helpers/`.
function add({
	color,
	eventType,
	index,
	x,
	y
}: {
	color: string;
	eventType: EventNames;
	index: number;
	x: number;
	y: number;
}): TextAction {
	return {
		name: TOOL_TEXT,
		content: '',
		color,
		eventType,
		index,
		x,
		y
	};
}

function drag({
	stack,
	textbox,
	x,
	y
}: {
	stack: SketchAction[];
	textbox: { index: number; width: number; height: number };
	x: number;
	y: number;
}) {
	const targetIndex = findIndex(stack, textbox.index);
	const canvas = get(canvasElement)!;
	const resolution = get(dpr);
	const scaledWidth = canvas.width / resolution;
	const scaledHeight = canvas.height / resolution;
	const target = { ...(stack[targetIndex] as TextAction), x, y };

	// work out if box is going to be outside the paper boundaries
	if (target.x < 0) {
		target.x = 0;
	}

	if (target.x + textbox.width > scaledWidth) {
		target.x = scaledWidth - textbox.width;
	}

	if (target.y < 0) {
		target.y = 0;
	}

	if (target.y + textbox.height > scaledHeight) {
		target.y = scaledHeight - textbox.height;
	}

	actions.update(getUpdatedActions(target, targetIndex));
}

function findIndex(array: SketchAction[], index: number) {
	return array.findIndex((entry) => entry.index === index);
}

function remove({ stack, index }: { stack: SketchAction[]; index: number }) {
	const targetIndex = findIndex(stack, index);

	const updatedActions = clone(stack);
	updatedActions.splice(targetIndex, 1);

	actions.push(updatedActions);
}

function updateContent({
	stack,
	index,
	content
}: {
	stack: SketchAction[];
	index: number;
	content: string;
}) {
	const targetIndex = findIndex(stack, index);
	const newAction = { ...(clone(stack[targetIndex]) as TextAction), content };

	actions.push(getUpdatedActions(newAction, targetIndex));
}

export default {
	add,
	drag,
	remove,
	updateContent
};
