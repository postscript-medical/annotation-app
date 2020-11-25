import IconArrow from '../components/icons/IconArrow.svelte';
import IconEllipse from '../components/icons/IconEllipse.svelte';
import IconLineThickness from '../components/icons/IconLineThickness.svelte';
import IconRectangle from '../components/icons/IconRectangle.svelte';
import IconTrashBin from '../components/icons/IconTrashBin.svelte';
import {
  DEFAULT_COLOR,
  DEFAULT_SIZE,
  LINE_THICKNESS_0,
  LINE_THICKNESS_1,
  LINE_THICKNESS_2,
  LINE_THICKNESS_3,
  LINE_THICKNESS_4,
  LINE_THICKNESS_5,
  LINE_THICKNESS_6,
  SIZE_MEDIUM,
  SIZE_LARGE,
  TOOL_ERASE_ALL,
  TOOL_ARROW,
  TOOL_ELLIPSE,
  TOOL_RECTANGLE,
} from './defaults.js';

export const ERASER_SIZES = [
  {
    id: DEFAULT_SIZE,
    value: LINE_THICKNESS_4,
    component: IconLineThickness,
  },
  {
    id: SIZE_MEDIUM,
    value: LINE_THICKNESS_5,
    component: IconLineThickness,
  },
  {
    id: SIZE_LARGE,
    value: LINE_THICKNESS_6,
    component: IconLineThickness,
  },
  {
    id: TOOL_ERASE_ALL,
    value: LINE_THICKNESS_0,
    component: IconTrashBin,
  }
];

export const PEN_COLORS = [
  {
    id: DEFAULT_COLOR,
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
    id: DEFAULT_SIZE,
    value: LINE_THICKNESS_1,
    component: IconLineThickness,
  },
  {
    id: SIZE_MEDIUM,
    value: LINE_THICKNESS_2,
    component: IconLineThickness,
  },
  {
    id: SIZE_LARGE,
    value: LINE_THICKNESS_3,
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
