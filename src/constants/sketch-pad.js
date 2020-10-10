/*
* Redirect via Netlify > https://markus.oberlehner.net/blog/using-netlify-redirects-to-proxy-images-hosted-on-a-third-party-image-provider-or-a-headless-cms
*/
const redirectPath = '/images/medical/';

export const DEFAULT_COLOR_ID = 'black';

export const DEFAULT_SHAPE_ID = 'rectangle';

export const DEFAULT_SIZE_ID = 'small';

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
    value: 6
  },
  {
    id: 'medium',
    value: 12
  },
  {
    id: 'large',
    value: 24
  },
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
    value: 'rgb(0,255,0)',
  },
];

export const PEN_SIZES = [
  {
    id: DEFAULT_SIZE_ID,
    value: 2
  },
  {
    id: 'medium',
    value: 4
  },
  {
    id: 'large',
    value: 6
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
  src: redirectPath + '/v1601715180/postscript-medical/annotation-app/icons/left_arrow.svg',
  length: 0,
  value: TOOL_ARROW,
};

const SHAPE_ELLIPSE = {
  ...SHAPE_DEFAULT,
  id: TOOL_ELLIPSE,
  value: TOOL_ELLIPSE,
};

const SHAPE_RECTANGLE = {
  ...SHAPE_DEFAULT,
  id: TOOL_RECTANGLE,
  value: TOOL_RECTANGLE,
};

export const SHAPES = [
  SHAPE_ARROW,
  SHAPE_ELLIPSE,
  SHAPE_RECTANGLE,
];
