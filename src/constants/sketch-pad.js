export const DEFAULT_COLOR_ALIAS = 'black';

export const DEFAULT_SIZE_ALIAS = 'small';

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
    alias: DEFAULT_SIZE_ALIAS,
    value: 6
  },
  {
    alias: 'medium',
    value: 12
  },
  {
    alias: 'large',
    value: 24
  },
];

export const PEN_COLORS = [
  {
    alias: DEFAULT_COLOR_ALIAS,
    value: 'rgb(0,0,0)',
  },
  {
    alias: 'red',
    value: 'rgb(255,0,0)',
  },
  {
    alias: 'green',
    value: 'rgb(0,255,0)',
  },
];

export const PEN_SIZES = [
  {
    alias: DEFAULT_SIZE_ALIAS,
    value: 2
  },
  {
    alias: 'medium',
    value: 4
  },
  {
    alias: 'large',
    value: 6
  },
];

export const TOOL_ERASER = 'eraser';

export const TOOL_PEN = 'pen';

export const TOOL_TEXT = 'text';