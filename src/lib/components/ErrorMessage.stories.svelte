<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ErrorMessage from './ErrorMessage.svelte';

	const { Story } = defineMeta({
		title: 'Components/Feedback/ErrorMessage',
		component: ErrorMessage,
		parameters: {
			docs: {
				description: {
					component:
						'An inline error on a light surface, announced to screen readers when it appears. Renders nothing without a message. On the green pages use `Notice`.'
				}
			}
		}
	});
</script>

<Story name="Default" args={{ message: "We couldn't save your choice. Please try again." }} />
<Story name="No message" args={{ message: null }} />
