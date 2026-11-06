// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
// Sketchpad stores, ported as-is (2.1) from legacy `stores.js`: the undo/redo `actions` store and
// the canvas, viewport and drawer stores the sketchpad uses. Converted to runes in 2.9.
//
// Not ported: the app-level stores (`session`, `user`, `protectedContent`, the catalogue stores,
// `customerPortalUrl`), which 2.3/2.4 replace with server data. Legacy derived
// `selectedIllustration` and `selectedIllustrationTitle` from `protectedContent`; here they are
// plain writables that /annotate (2.4) sets, and that `SketchPad` updates on undo/redo of an image
// change, as before.
//
// These are module-level singletons, so the sketchpad must render in the browser only: on the
// server they would be shared between requests (and `SketchPad` reads `window` when created).
import { derived, readable, writable } from 'svelte/store';
import {
	TOOL_TEXT,
	VIEWPORT_PHONE,
	VIEWPORT_TABLET,
	VIEWPORT_LAPTOP,
	VIEWPORT_WIDESCREEN
} from './constants.js';

export const viewportType = readable(VIEWPORT_PHONE, (set) => {
	const mediaQueryPhone = window.matchMedia('(max-width: 599px');
	const mediaQueryTablet = window.matchMedia('(min-width: 600px) and (max-width: 899px)');
	const mediaQueryLaptop = window.matchMedia('(min-width: 900px) and (max-width: 1199px)');
	const mediaQueryWideScreen = window.matchMedia('(min-width: 1200px)');
	const hasEventListenerType = mediaQueryPhone.addEventListener;

	function phoneQueryChange({ matches }) {
		if (matches) set(VIEWPORT_PHONE);
	}

	function tabletQueryChange({ matches }) {
		if (matches) set(VIEWPORT_TABLET);
	}

	function laptopQueryChange({ matches }) {
		if (matches) set(VIEWPORT_LAPTOP);
	}

	function widescreenQueryChange({ matches }) {
		if (matches) set(VIEWPORT_WIDESCREEN);
	}

	/* iOS does not seem to currently support 'addEventListener' */
	if (hasEventListenerType) {
		mediaQueryPhone.addEventListener('change', phoneQueryChange);
		mediaQueryTablet.addEventListener('change', tabletQueryChange);
		mediaQueryLaptop.addEventListener('change', laptopQueryChange);
		mediaQueryWideScreen.addEventListener('change', widescreenQueryChange);
	} else {
		mediaQueryPhone.addListener(phoneQueryChange);
		mediaQueryTablet.addListener(tabletQueryChange);
		mediaQueryLaptop.addListener(laptopQueryChange);
		mediaQueryWideScreen.addListener(widescreenQueryChange);
	}

	phoneQueryChange(mediaQueryPhone);
	tabletQueryChange(mediaQueryTablet);
	laptopQueryChange(mediaQueryLaptop);
	widescreenQueryChange(mediaQueryWideScreen);

	return () => {
		if (hasEventListenerType) {
			mediaQueryPhone.removeEventListener('change', phoneQueryChange);
			mediaQueryTablet.removeEventListener('change', tabletQueryChange);
			mediaQueryLaptop.removeEventListener('change', laptopQueryChange);
			mediaQueryWideScreen.removeEventListener('change', widescreenQueryChange);
		} else {
			mediaQueryPhone.removeListener(phoneQueryChange);
			mediaQueryTablet.removeListener(tabletQueryChange);
			mediaQueryLaptop.removeListener(laptopQueryChange);
			mediaQueryWideScreen.removeListener(widescreenQueryChange);
		}
	};
});

/**
 * Header-related stores (the user menu arrives in 2.4)
 */
export const userSettingsDropdownDrawerOpen = writable(false);

export function closeUserSettingsDropdown() {
	userSettingsDropdownDrawerOpen.set(false);
}

/**
 * Canvas-related stores
 */
export const actions = (function () {
	/**
	 * Adapted from Rich Harris svelte-undo
	 * & lihautan Undo/Redo with Svelte store video
	 */
	const stack = [];

	let index = stack.length;

	const state = writable({
		first: true,
		last: true,
		current: stack,
		stack,
		index
	});

	function update() {
		const current = stack[index - 1];

		state.set({
			first: index === 1,
			last: index === stack.length,
			current: current || [],
			stack,
			index
		});
	}

	return {
		jumpTo: (newIndex) => {
			if (newIndex > 0 && newIndex < stack.length) index = newIndex;

			update();
		},
		push: (value) => {
			stack.length = index;
			stack[index++] = value;

			update();
		},
		redo: () => {
			if (index < stack.length) index += 1;

			update();
		},
		set: (value) => {
			stack.length = 0;

			if (value) {
				stack.push(value);
			}

			index = stack.length;

			update();
		},
		subscribe: state.subscribe,
		undo: () => {
			if (index > 1) index -= 1;

			update();
		},
		update: (value) => {
			stack.length = index;
			stack[index - 1] = value;

			update();
		}
	};
})();

export const canvasElement = writable();

export const context = writable();

/**
 * The canvas backing-store scale: the device's pixel ratio, capped at 2 to bound canvas memory.
 * (Legacy wrote `(window.devicePixelRatio || 1, 2)`, which the comma operator made always 2.)
 */
export function pixelRatio(devicePixelRatio) {
	return Math.min(devicePixelRatio || 1, 2);
}

export const dpr = readable(1, (set) => {
	set(pixelRatio(window.devicePixelRatio));

	return () => {};
});

export const toolDrawerOpen = writable('');

export const typedTextEntries = derived(actions, ($actions) =>
	$actions.current.filter(({ name }) => name === TOOL_TEXT)
);

/**
 * Illustration-related stores
 */
export const illustrationDisplayed = writable();

// The selected illustration (`{ src, … }`) and its title; set by /annotate (2.4).
export const selectedIllustration = writable(null);

export const selectedIllustrationTitle = writable('');
