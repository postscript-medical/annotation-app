// Sketchpad constants, ported as-is (2.1) from legacy `constants/defaults.js` (only the entries the
// sketchpad uses; roles, thumbnail paths and modal ids are not ported here) and
// `constants/sketch-pad.js`. The size ids come from the icons' own `sizes.ts`, which holds the
// same values.
import IconArrow from '../components/icons/IconArrow.svelte';
import IconEllipse from '../components/icons/IconEllipse.svelte';
import IconEraserSize from '../components/icons/IconEraserSize.svelte';
import IconLineThickness from '../components/icons/IconLineThickness.svelte';
import IconRectangle from '../components/icons/IconRectangle.svelte';
import IconTrashBin from '../components/icons/IconTrashBin.svelte';
import { DEFAULT_SIZE, SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL } from '../components/icons/sizes.ts';

export { DEFAULT_SIZE, SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL };

export const DEFAULT_COLOR = 'black';

export const DEFAULT_SHAPE = 'rectangle';

export const LINE_THICKNESS_0 = 0;
export const LINE_THICKNESS_1 = 2;
export const LINE_THICKNESS_2 = 4;
export const LINE_THICKNESS_3 = 6;
export const LINE_THICKNESS_4 = 32;
export const LINE_THICKNESS_5 = 64;
export const LINE_THICKNESS_6 = 96;

export const RADIAN = 6.28318;

export const TOOL_ARROW = 'arrow';

export const TOOL_CHANGE_IMAGE = 'change-image';

export const TOOL_ELLIPSE = 'ellipse';

export const TOOL_ERASE_ALL = 'erase-all';

export const TOOL_ERASER = 'eraser';

export const TOOL_PEN = 'pen';

export const TOOL_RECTANGLE = DEFAULT_SHAPE;

export const TOOL_CATALOGUE = 'catalogue';

export const TOOL_SHAPE = 'shape';

export const TOOL_TEXT = 'text';

export const VIEWPORT_PHONE = 'phone';

export const VIEWPORT_TABLET = 'tablet';

export const VIEWPORT_LAPTOP = 'laptop';

export const VIEWPORT_WIDESCREEN = 'wide';

export const EVENTS_TOUCH = {
	down: 'touchstart',
	move: 'touchmove',
	up: 'touchend'
};

export const EVENTS_POINTER = {
	down: 'pointerdown',
	move: 'pointermove',
	up: 'pointerup'
};

export const IMAGE_CATALOGUE = 'image-catalogue';

export const ERASER_SIZES = [
	{
		id: DEFAULT_SIZE,
		value: LINE_THICKNESS_4,
		component: IconEraserSize
	},
	{
		id: SIZE_MEDIUM,
		value: LINE_THICKNESS_5,
		component: IconEraserSize
	},
	{
		id: SIZE_LARGE,
		value: LINE_THICKNESS_6,
		component: IconEraserSize
	},
	{
		id: TOOL_ERASE_ALL,
		value: LINE_THICKNESS_0,
		component: IconTrashBin
	}
];

export const PEN_COLORS = [
	{
		id: DEFAULT_COLOR,
		value: '#000000'
	},
	{
		id: 'red',
		value: '#ff0000'
	},
	{
		id: 'green',
		value: '#379a46'
	}
];

export const PEN_SIZES = [
	{
		id: DEFAULT_SIZE,
		value: LINE_THICKNESS_1,
		component: IconLineThickness
	},
	{
		id: SIZE_MEDIUM,
		value: LINE_THICKNESS_2,
		component: IconLineThickness
	},
	{
		id: SIZE_LARGE,
		value: LINE_THICKNESS_3,
		component: IconLineThickness
	}
];

const SHAPE_DEFAULT = {
	x: 0,
	y: 0,
	dx: 0,
	dy: 0
};

export const SHAPE_ARROW = {
	...SHAPE_DEFAULT,
	id: TOOL_ARROW,
	length: 0,
	value: TOOL_ARROW,
	component: IconArrow
};

const SHAPE_ELLIPSE = {
	...SHAPE_DEFAULT,
	id: TOOL_ELLIPSE,
	value: TOOL_ELLIPSE,
	component: IconEllipse
};

const SHAPE_RECTANGLE = {
	...SHAPE_DEFAULT,
	id: TOOL_RECTANGLE,
	value: TOOL_RECTANGLE,
	component: IconRectangle
};

export const SHAPES = [SHAPE_ARROW, SHAPE_ELLIPSE, SHAPE_RECTANGLE];
