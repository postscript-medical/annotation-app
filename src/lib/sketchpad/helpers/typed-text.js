// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
// Ported as-is (2.1) from legacy `components/sketchpad/helpers/`.
import { get } from 'svelte/store';
import { TOOL_TEXT } from '../constants.js';
import { actions, canvasElement, dpr } from '../stores.js';
import clone from './clone.js';
import getUpdatedActions from './get-updated-actions.js';

function add({ color, eventType, index, x, y }) {
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

function drag({ stack, textbox, x, y }) {
	const targetIndex = findIndex(stack, textbox.index);
	const canvas = get(canvasElement);
	const resolution = get(dpr);
	const scaledWidth = canvas.width / resolution;
	const scaledHeight = canvas.height / resolution;
	const target = { ...stack[targetIndex], x, y };

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

function findIndex(array, index) {
	return array.findIndex((entry) => entry.index === index);
}

function remove({ stack, index }) {
	const targetIndex = findIndex(stack, index);

	let updatedActions = clone(stack);
	updatedActions.splice(targetIndex, 1);

	actions.push(updatedActions);
}

function updateContent({ stack, index, content }) {
	const targetIndex = findIndex(stack, index);
	let newAction = { ...clone(stack[targetIndex]), content };

	actions.push(getUpdatedActions(newAction, targetIndex));
}

export default {
	add,
	drag,
	remove,
	updateContent
};
