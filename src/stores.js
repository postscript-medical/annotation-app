import { derived, readable, writable } from 'svelte/store';
import { TOOL_TEXT } from './constants/sketch-pad';

let _contentLevel = 'Not logged in';



export const session = writable(false);

// TODO: We want to reactively trigger a loadProtectedContent when the user is updated
export const user = writable(false);

export const isLoading = writable(true);

export const protectedContent = writable(_contentLevel);

/**
 * Canvas-related stores
 */
export const actions = writable([]);
export const canvas = writable();
export const context = writable();

export const typedTextEntries = derived(
  actions,
  $actions => $actions.filter(({ name }) => name === TOOL_TEXT)
);