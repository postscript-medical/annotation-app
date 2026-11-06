<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { illustrations } from '#lib/design/fixtures.ts';
	import ImagesGrid from './ImagesGrid.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Catalogue/ImagesGrid',
		component: ImagesGrid,
		args: { images: illustrations, onselect: fn() },
		argTypes: { images: { control: false } },
		parameters: {
			docs: {
				description: { component: 'The catalogue’s thumbnails, or a message when nothing matches.' }
			}
		}
	});
</script>

<Story name="Default" />
<Story name="With selection" args={{ activeId: 'i2' }} />
<Story name="Disabled while saving" args={{ activeId: 'i2', disabled: true }} />
<Story name="No results" args={{ images: [] }} />
