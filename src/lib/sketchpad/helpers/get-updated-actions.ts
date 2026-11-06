import { get } from 'svelte/store';
import { actions } from '../stores.ts';
import type { SketchAction } from '../types.ts';
import clone from './clone.ts';

// Ported from legacy `components/sketchpad/helpers/`.
export default function getUpdatedActions(updatedAction: SketchAction, index: number) {
	const state = get(actions);
	const updatedActions = clone(state.current);
	updatedActions[index] = updatedAction;

	return updatedActions;
}
