import { derived, writable } from 'svelte/store';
import { TOOL_TEXT } from './constants/sketch-pad';

export const session = writable();

// Investigate: We want to reactively trigger a loadProtectedContent when the user is updated
export const user = writable();

export const isLoading = writable(true);

export const protectedContent = writable();

/**
 * Header-related stores
 */
export const openDrawer = writable(false);
export const customerPortalUrl = derived(user, ($user, set) => {
  if (!$user) return;

  fetch('/.netlify/functions/create-manage-link', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${$user.token.access_token}`,
    },
  })
  .then(response => response.json())
  .then(link => {
    set(link);
  })
}, '#');

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