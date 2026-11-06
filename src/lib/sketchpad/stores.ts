// Sketchpad stores, ported as-is (2.1) from legacy `stores.js`: the undo/redo `actions` store and
// the canvas, viewport and drawer stores the sketchpad uses. They stay Svelte stores (2.9): the
// undo stack and the helpers use them outside components, where a store is the simpler fit.
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
} from './constants.ts';
import type { Illustration } from '../catalogue/types.ts';
import type { SketchAction, TextAction } from './types.ts';

export const viewportType = readable<string>(VIEWPORT_PHONE, (set) => {
	const mediaQueryPhone = window.matchMedia('(max-width: 599px)');
	const mediaQueryTablet = window.matchMedia('(min-width: 600px) and (max-width: 899px)');
	const mediaQueryLaptop = window.matchMedia('(min-width: 900px) and (max-width: 1199px)');
	const mediaQueryWideScreen = window.matchMedia('(min-width: 1200px)');

	function phoneQueryChange({ matches }: { matches: boolean }) {
		if (matches) set(VIEWPORT_PHONE);
	}

	function tabletQueryChange({ matches }: { matches: boolean }) {
		if (matches) set(VIEWPORT_TABLET);
	}

	function laptopQueryChange({ matches }: { matches: boolean }) {
		if (matches) set(VIEWPORT_LAPTOP);
	}

	function widescreenQueryChange({ matches }: { matches: boolean }) {
		if (matches) set(VIEWPORT_WIDESCREEN);
	}

	mediaQueryPhone.addEventListener('change', phoneQueryChange);
	mediaQueryTablet.addEventListener('change', tabletQueryChange);
	mediaQueryLaptop.addEventListener('change', laptopQueryChange);
	mediaQueryWideScreen.addEventListener('change', widescreenQueryChange);

	phoneQueryChange(mediaQueryPhone);
	tabletQueryChange(mediaQueryTablet);
	laptopQueryChange(mediaQueryLaptop);
	widescreenQueryChange(mediaQueryWideScreen);

	return () => {
		mediaQueryPhone.removeEventListener('change', phoneQueryChange);
		mediaQueryTablet.removeEventListener('change', tabletQueryChange);
		mediaQueryLaptop.removeEventListener('change', laptopQueryChange);
		mediaQueryWideScreen.removeEventListener('change', widescreenQueryChange);
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
	const stack: SketchAction[][] = [];

	let index = stack.length;

	const state = writable({
		first: true,
		last: true,
		current: [] as SketchAction[],
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
		jumpTo: (newIndex: number) => {
			if (newIndex > 0 && newIndex < stack.length) index = newIndex;

			update();
		},
		push: (value: SketchAction[]) => {
			stack.length = index;
			stack[index++] = value;

			update();
		},
		redo: () => {
			if (index < stack.length) index += 1;

			update();
		},
		set: (value?: SketchAction[]) => {
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
		update: (value: SketchAction[]) => {
			stack.length = index;
			stack[index - 1] = value;

			update();
		}
	};
})();

export const canvasElement = writable<HTMLCanvasElement | null | undefined>();

/**
 * The canvas backing-store scale: the device's pixel ratio, capped at 2 to bound canvas memory.
 * (Legacy wrote `(window.devicePixelRatio || 1, 2)`, which the comma operator made always 2.)
 */
export function pixelRatio(devicePixelRatio: number | undefined) {
	return Math.min(devicePixelRatio || 1, 2);
}

export const dpr = readable(1, (set) => {
	set(pixelRatio(window.devicePixelRatio));

	return () => {};
});

export const toolDrawerOpen = writable('');

export const typedTextEntries = derived(actions, ($actions) =>
	$actions.current.filter((action): action is TextAction => action.name === TOOL_TEXT)
);

/**
 * Illustration-related stores
 */
export const illustrationDisplayed = writable<HTMLImageElement | null | undefined>();

// The selected illustration (`{ src, … }`) and its title; set by /annotate (2.4).
export const selectedIllustration = writable<Illustration | null>(null);

export const selectedIllustrationTitle = writable('');
