import IconArrow from '../components/icons/IconArrow.svelte';
import IconEllipse from '../components/icons/IconEllipse.svelte';
import IconLineThickness from '../components/icons/IconLineThickness.svelte';
import IconRectangle from '../components/icons/IconRectangle.svelte';
import IconTrashBin from '../components/icons/IconTrashBin.svelte';

/*
* Redirect via Netlify > https://markus.oberlehner.net/blog/using-netlify-redirects-to-proxy-images-hosted-on-a-third-party-image-provider-or-a-headless-cms
*/
const redirectPath = '/images/';

export const SIZE_SMALL_ID = 'small';

export const SIZE_MEDIUM_ID = 'medium';

export const SIZE_LARGE_ID = 'large';

export const DEFAULT_COLOR_ID = 'black';

export const DEFAULT_SHAPE_ID = 'rectangle';

export const DEFAULT_SIZE_ID = SIZE_SMALL_ID;

export const RADIAN = 6.28318;

export const TOOL_ARROW = 'arrow';

export const TOOL_ELLIPSE =  'ellipse';

export const TOOL_ERASE_ALL = 'erase_all';

export const TOOL_ERASER = 'eraser';

export const TOOL_PEN = 'pen';

export const TOOL_RECTANGLE = DEFAULT_SHAPE_ID;

export const TOOL_SEARCH = 'search';

export const TOOL_SHAPE = 'shape';

export const TOOL_TEXT = 'text';

export const EVENTS_TOUCH = {
  down: 'touchstart',
  move: 'touchmove',
  up: 'touchend',
};

export const EVENTS_POINTER = {
  down: 'pointerdown',
  move: 'pointermove',
  up: 'pointerup',
};

export const ERASER_SIZES = [
  {
    id: DEFAULT_SIZE_ID,
    value: 6,
    component: IconLineThickness,
  },
  {
    id: SIZE_MEDIUM_ID,
    value: 12,
    component: IconLineThickness,
  },
  {
    id: SIZE_LARGE_ID,
    value: 24,
    component: IconLineThickness,
  },
  {
    id: TOOL_ERASE_ALL,
    value: 0,
    component: IconTrashBin,
  }
];

export const PEN_COLORS = [
  {
    id: DEFAULT_COLOR_ID,
    value: 'rgb(0,0,0)',
  },
  {
    id: 'red',
    value: 'rgb(255,0,0)',
  },
  {
    id: 'green',
    value: 'rgb(55, 154, 70)',
  },
];

export const PEN_SIZES = [
  {
    id: DEFAULT_SIZE_ID,
    value: 2,
    component: IconLineThickness,
  },
  {
    id: SIZE_MEDIUM_ID,
    value: 4,
    component: IconLineThickness,
  },
  {
    id: SIZE_LARGE_ID,
    value: 6,
    component: IconLineThickness,
  },
];

const SHAPE_DEFAULT = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
};

export const SHAPE_ARROW = {
  ...SHAPE_DEFAULT,
  id: TOOL_ARROW,
  src: redirectPath + 'postscript-medical/annotation-app/icons/left_arrow.svg',
  length: 0,
  value: TOOL_ARROW,
  component: IconArrow,
};

const SHAPE_ELLIPSE = {
  ...SHAPE_DEFAULT,
  id: TOOL_ELLIPSE,
  value: TOOL_ELLIPSE,
  component: IconEllipse,
};

const SHAPE_RECTANGLE = {
  ...SHAPE_DEFAULT,
  id: TOOL_RECTANGLE,
  value: TOOL_RECTANGLE,
  component: IconRectangle,
};

export const SHAPES = [
  SHAPE_ARROW,
  SHAPE_ELLIPSE,
  SHAPE_RECTANGLE,
];
