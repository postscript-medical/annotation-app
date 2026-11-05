import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EVENTS_POINTER, TOOL_PEN, TOOL_TEXT } from '../constants.js';
import { actions, canvasElement } from '../stores.js';
import typedText from './typed-text.js';

const stroke = { name: TOOL_PEN, index: 0, points: [] };
const note = { name: TOOL_TEXT, index: 1, content: 'note', color: 'black', x: 10, y: 10 };

function state() {
	const { current, index } = get(actions);
	return { current, index };
}

describe('typedText', () => {
	beforeEach(() => actions.set([stroke, note]));

	it('add() builds an empty text action', () => {
		expect(
			typedText.add({ color: 'red', eventType: EVENTS_POINTER, index: 3, x: 4, y: 5 })
		).toEqual({
			name: TOOL_TEXT,
			content: '',
			color: 'red',
			eventType: EVENTS_POINTER,
			index: 3,
			x: 4,
			y: 5
		});
	});

	it('updateContent() pushes an undo step with the new text', () => {
		typedText.updateContent({ stack: [stroke, note], index: 1, content: 'edited' });

		expect(state()).toEqual({ current: [stroke, { ...note, content: 'edited' }], index: 2 });
		actions.undo();
		expect(state().current).toEqual([stroke, note]);
	});

	it('remove() pushes an undo step without the entry', () => {
		typedText.remove({ stack: [stroke, note], index: 1 });

		expect(state()).toEqual({ current: [stroke], index: 2 });
		actions.undo();
		expect(state().current).toEqual([stroke, note]);
	});

	describe('drag()', () => {
		// A 400×300 CSS-pixel canvas at a device pixel ratio of 2 (backing store 800×600).
		beforeEach(() => {
			vi.stubGlobal('window', { devicePixelRatio: 2 });
			canvasElement.set({ width: 800, height: 600 });
		});

		afterEach(() => {
			vi.unstubAllGlobals();
			canvasElement.set(undefined);
		});

		const textbox = { index: 1, width: 100, height: 40 };

		function drag(x: number, y: number) {
			typedText.drag({ stack: get(actions).current, textbox, x, y });
			return get(actions).current[1];
		}

		it('moves the entry in place, without a new undo step', () => {
			expect(drag(50, 60)).toEqual({ ...note, x: 50, y: 60 });
			expect(state().index).toBe(1);
		});

		it('keeps the box inside the canvas (in CSS pixels)', () => {
			expect(drag(-5, -5)).toMatchObject({ x: 0, y: 0 });
			expect(drag(390, 290)).toMatchObject({ x: 300, y: 260 });
		});

		it('uses the capped pixel ratio for the bounds', () => {
			// A ratio of 3 is capped at 2, so the canvas is still 400×300 CSS pixels.
			vi.stubGlobal('window', { devicePixelRatio: 3 });

			expect(drag(390, 290)).toMatchObject({ x: 300, y: 260 });
		});
	});
});
