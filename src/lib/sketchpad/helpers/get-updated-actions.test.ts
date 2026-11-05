import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { TOOL_PEN } from '../constants.js';
import { actions } from '../stores.js';
import getUpdatedActions from './get-updated-actions.js';

const first = { name: TOOL_PEN, index: 0, points: [{ x: 1, y: 1 }] };
const second = { name: TOOL_PEN, index: 1, points: [{ x: 2, y: 2 }] };

describe('getUpdatedActions', () => {
	beforeEach(() => actions.set([first, second]));

	it('returns the current actions with the entry at `index` replaced', () => {
		const replacement = { ...second, points: [{ x: 3, y: 3 }] };

		expect(getUpdatedActions(replacement, 1)).toEqual([first, replacement]);
	});

	it('deep-copies the other entries and leaves the store unchanged', () => {
		const updated = getUpdatedActions({ ...first, color: 'red' }, 0);

		expect(updated[1]).toEqual(second);
		expect(updated[1]).not.toBe(get(actions).current[1]);
		expect(get(actions).current).toEqual([first, second]);
	});

	it('appends when `index` is the next free slot', () => {
		const third = { name: TOOL_PEN, index: 2, points: [] };

		expect(getUpdatedActions(third, 2)).toEqual([first, second, third]);
	});
});
