<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import ShareModal from './ShareModal.svelte';

	const image = new Blob([new Uint8Array(1)], { type: 'image/jpeg' });

	const { Story } = defineMeta({
		title: 'Annotation/Modals/ShareModal',
		component: ShareModal,
		args: { prepare: () => Promise.resolve(image), onprint: fn(), onclose: fn() },
		argTypes: { prepare: { control: false } },
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 520 },
				description: {
					component:
						'Share the annotated image from the device: the system share sheet where the browser offers one, download or print. The image never goes through the server. The share section only appears in browsers that can share files.'
				}
			}
		}
	});
</script>

<Story name="Ready" />
<Story name="Preparing" args={{ prepare: () => new Promise<Blob>(() => {}) }} />
<Story name="Failed" args={{ prepare: () => Promise.reject(new Error('Story')) }} />
