<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { catalogue } from '#lib/design/fixtures.ts';
	import ImageCatalogue from './ImageCatalogue.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Catalogue/ImageCatalogue',
		component: ImageCatalogue,
		args: { catalogue, onselect: fn(), onclose: fn() },
		argTypes: { catalogue: { control: false } },
		parameters: {
			layout: 'fullscreen',
			docs: {
				story: { inline: false, iframeHeight: 640 },
				description: {
					component:
						'The illustration panel: browse by specialty and sub-specialty, search by name or alias, pick an illustration.'
				}
			}
		}
	});
</script>

<Story name="Default" args={{ specialtyId: 's1', subSpecialtyId: 'ss1' }} />
<Story
	name="With selection"
	args={{ specialtyId: 's1', subSpecialtyId: 'ss1', activeIllustrationId: 'i2' }}
/>
<Story
	name="Save failed"
	args={{ specialtyId: 's1', error: "We couldn't save your choice. Please try again." }}
/>
