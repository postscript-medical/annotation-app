<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import FeedbackModal from './FeedbackModal.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Modals/FeedbackModal',
		component: FeedbackModal,
		args: { onclose: fn() },
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 460 },
				description: {
					component:
						'Feedback or a bug report, sent through the `?/feedback` form action, which doesn’t exist in Storybook: sending here ends in the error state.'
				}
			}
		}
	});
</script>

<Story name="Default" />
