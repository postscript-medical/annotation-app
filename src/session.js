import { writable } from 'svelte/store';

export const session = writable(false);
export const user = writable(false);