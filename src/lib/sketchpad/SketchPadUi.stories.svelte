<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { PEN_COLORS, TOOL_PEN } from './constants.ts';
	import SketchPadUi from './SketchPadUi.svelte';
	import { toolDrawerOpen } from './stores.ts';

	const { Story } = defineMeta({
		title: 'Annotation/Toolbar/SketchPadUi',
		component: SketchPadUi,
		args: {
			pen: { name: 'pen', lineWidth: 2, color: PEN_COLORS[0].value },
			eraser: { name: 'eraser', lineWidth: 32, color: 'white' },
			shape: { name: 'shape', lineWidth: 2, color: PEN_COLORS[0].value, type: 'rectangle' },
			selectedToolId: TOOL_PEN,
			accountInitial: 'S',
			onchangethickness: fn(),
			onchangecolor: fn(),
			onchangeshape: fn(),
			onerase: fn(),
			onopencatalogue: fn(),
			onopenshare: fn(),
			onopenfeedback: fn(),
			onredo: fn(),
			onselecttool: fn(),
			onundo: fn()
		},
		argTypes: { pen: { control: false }, eraser: { control: false }, shape: { control: false } },
		globals: { backgrounds: { value: 'canvas' } },
		beforeEach: () => toolDrawerOpen.set(''),
		parameters: {
			layout: 'fullscreen',
			docs: {
				story: { inline: false, iframeHeight: 640 },
				description: {
					component:
						'Everything that sits over the canvas: the header and the toolbar, which runs down the left from 900px wide and along the bottom below that. Try it in the Phone viewport.'
				}
			}
		}
	});
</script>

<Story name="Desktop" />
<Story name="Phone" globals={{ viewport: { value: 'phone' } }} />
