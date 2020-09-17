import { readable, writable } from 'svelte/store';

let _contentLevel = 'Not logged in';



export const session = writable(false);

// TODO: We want to reactively trigger a loadProtectedContent when the user is updated
export const user = writable(false);

export const isLoading = writable(false);

export const protectedContent = writable(_contentLevel);