import { derived, writable } from 'svelte/store';
import { TOOL_TEXT } from './constants/sketch-pad';

export const session = writable();

// Investigate: We want to reactively trigger a loadProtectedContent when the user is updated
export const user = writable();

export const isLoading = writable(true);

export const protectedContent = writable();

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