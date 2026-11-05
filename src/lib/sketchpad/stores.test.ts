import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOOL_PEN, TOOL_TEXT } from './constants.js';
import { actions, dpr, pixelRatio, typedTextEntries } from './stores.js';

// Pins the legacy undo/redo store's behaviour (ported as-is in 2.1) before the runes
// conversion (2.8). Each stack entry is the whole list of drawn actions at that point.
const a = [{ name: TOOL_PEN, index: 0 }];
const b = [...a, { name: TOOL_PEN, index: 1 }];
const c = [...b, { name: TOOL_TEXT, index: 2, content: 'note' }];

function state() {
	const { first, last, current, index } = get(actions);
	return { first, last, current, index };
}

describe('actions (undo/redo stack)', () => {
	beforeEach(() => actions.set());

	it('starts empty after set() with no value', () => {
		expect(state()).toEqual({ first: false, last: true, current: [], index: 0 });
	});

	it('set(value) replaces the history with one entry', () => {
		actions.push(a);
		actions.set(b);
		expect(state()).toEqual({ first: true, last: true, current: b, index: 1 });
		expect(get(actions).stack).toEqual([b]);
	});

	it('push adds an entry and moves to it', () => {
		actions.set(a);
		actions.push(b);
		expect(state()).toEqual({ first: false, last: true, current: b, index: 2 });
	});

	it('undo and redo move through the history and stop at its ends', () => {
		actions.set(a);
		actions.push(b);
		actions.push(c);

		actions.undo();
		expect(state()).toMatchObject({ current: b, first: false, last: false });
		actions.undo();
		expect(state()).toMatchObject({ current: a, first: true });
		actions.undo();
		expect(state()).toMatchObject({ current: a, index: 1 });

		actions.redo();
		actions.redo();
		expect(state()).toMatchObject({ current: c, last: true });
		actions.redo();
		expect(state()).toMatchObject({ current: c, index: 3 });
	});

	it('push after undo drops the redo history', () => {
		actions.set(a);
		actions.push(b);
		actions.undo();
		actions.push(c);
		expect(get(actions).stack).toEqual([a, c]);
		expect(state()).toMatchObject({ current: c, last: true });
	});

	it('update replaces the current entry without adding one', () => {
		actions.set(a);
		actions.push(b);
		actions.update(c);
		expect(get(actions).stack).toEqual([a, c]);
		expect(state()).toMatchObject({ current: c, index: 2 });
	});

	it('update after undo replaces that entry and drops the redo history', () => {
		actions.set(a);
		actions.push(b);
		actions.undo();
		actions.update(c);
		expect(get(actions).stack).toEqual([c]);
	});

	it('jumpTo moves only to an index strictly inside the history', () => {
		actions.set(a);
		actions.push(b);
		actions.push(c);

		actions.jumpTo(1);
		expect(state()).toMatchObject({ current: a, index: 1 });
		actions.jumpTo(2);
		expect(state()).toMatchObject({ current: b, index: 2 });
		// Legacy quirk: the last index (stack.length) and 0 are ignored.
		actions.jumpTo(3);
		expect(state()).toMatchObject({ index: 2 });
		actions.jumpTo(0);
		expect(state()).toMatchObject({ index: 2 });
	});
});

describe('typedTextEntries', () => {
	beforeEach(() => actions.set());

	it('lists only the text entries of the current state', () => {
		actions.set(c);
		expect(get(typedTextEntries)).toEqual([c[2]]);
		actions.push(b);
		expect(get(typedTextEntries)).toEqual([]);
	});
});

describe('pixelRatio / dpr (fixed in 2.2; legacy was always 2)', () => {
	afterEach(() => vi.unstubAllGlobals());

	it.each([
		[1, 1],
		[1.5, 1.5],
		[2, 2],
		[3, 2],
		[undefined, 1],
		[0, 1]
	])('devicePixelRatio %s → %s', (devicePixelRatio, expected) => {
		expect(pixelRatio(devicePixelRatio)).toBe(expected);
	});

	it('dpr reads window.devicePixelRatio', () => {
		vi.stubGlobal('window', { devicePixelRatio: 1 });
		expect(get(dpr)).toBe(1);
	});
});
