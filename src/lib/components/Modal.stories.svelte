<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Modal from './Modal.svelte';

	const { Story } = defineMeta({
		title: 'Components/Overlays/Modal',
		component: Modal,
		render: template,
		args: { onclose: fn(), onconfirm: fn() },
		argTypes: {
			size: { control: 'inline-radio', options: ['normal', 'extend'] },
			header: { control: false },
			children: { control: false },
			footer: { control: false }
		},
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 420 },
				description: {
					component:
						'A native `<dialog>` opened with `showModal()`: focus moves in and stays, the page behind is inert, and Escape closes it like Cancel. Render it to open it; `onclose` should un-render it. Confirm or Enter calls `onconfirm`.'
				}
			}
		}
	});
</script>

{#snippet template(args: Record<string, unknown>)}
	<Modal {...args}>
		{#snippet header()}Remove this image?{/snippet}
		<p>Your annotations on it will be lost. This can't be undone.</p>
	</Modal>
{/snippet}

<Story name="Default" />
<Story name="Custom labels" args={{ confirmLabel: 'Remove', cancelLabel: 'Keep it' }} />
<Story name="Confirm disabled" args={{ disableConfirmButton: true }} />
<Story name="Loading" args={{ loading: true }} />
<Story name="Close button only" args={{ hideCancelButton: true, hideConfirmButton: true }} />
<Story name="Not dismissible" args={{ hideCancelButton: true, hideCloseButton: true }} />
<Story name="Extended" args={{ size: 'extend' }} />
