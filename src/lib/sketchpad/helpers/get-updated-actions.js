// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
// Ported as-is (2.1) from legacy `components/sketchpad/helpers/`.
import { get } from 'svelte/store';
import { actions } from '../stores.js';
import clone from './clone.js';

export default function getUpdatedActions(updatedAction, index) {
	const state = get(actions);
	const updatedActions = clone(state.current);
	updatedActions[index] = updatedAction;

	return updatedActions;
}
