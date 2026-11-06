<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { EVENTS_POINTER } from './constants.ts';
	import DragHandle from './DragHandle.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Toolbar/DragHandle',
		component: DragHandle,
		args: { index: 0, eventType: EVENTS_POINTER, ondrag: fn() },
		argTypes: { eventType: { control: false } },
		globals: { backgrounds: { value: 'canvas' } },
		parameters: {
			docs: { description: { component: 'The handle for moving a typed-text box on the image.' } }
		}
	});
</script>

<Story name="Default" />
