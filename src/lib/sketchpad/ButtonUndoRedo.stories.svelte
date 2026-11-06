<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import ButtonUndoRedo from './ButtonUndoRedo.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Toolbar/ButtonUndoRedo',
		component: ButtonUndoRedo,
		render: template,
		args: { onundo: fn(), onredo: fn() },
		globals: { backgrounds: { value: 'canvas' } },
		parameters: {
			docs: {
				description: {
					component:
						'Undo and redo. Each is enabled from the shared `actions` history, so with nothing drawn both are disabled, as here.'
				}
			}
		}
	});
</script>

{#snippet template(args: { onundo?: () => void; onredo?: () => void })}
	<div style:display="inline-block"><ButtonUndoRedo {...args} /></div>
{/snippet}

<Story name="No history" />
