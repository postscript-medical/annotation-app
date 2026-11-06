<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { thumbnailUrl } from '#lib/images.ts';
	import ImagesGridThumbnail from './ImagesGridThumbnail.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Catalogue/ImagesGridThumbnail',
		component: ImagesGridThumbnail,
		render: template,
		args: { src: thumbnailUrl('sample-a.svg') },
		parameters: {
			docs: {
				description: { component: 'One catalogue thumbnail: lazy-loaded, fades in once loaded.' }
			}
		}
	});
</script>

{#snippet template(args: { src: string; selected?: boolean })}
	<div style:width="180px"><ImagesGridThumbnail {...args} /></div>
{/snippet}

<Story name="Default" />
<Story name="Selected" args={{ selected: true }} />
