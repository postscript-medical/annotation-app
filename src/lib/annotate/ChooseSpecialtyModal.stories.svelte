<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { catalogue } from '#lib/design/fixtures.ts';
	import ChooseSpecialtyModal from './ChooseSpecialtyModal.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Modals/ChooseSpecialtyModal',
		component: ChooseSpecialtyModal,
		args: { catalogue, onconfirm: fn() },
		argTypes: { catalogue: { control: false } },
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 460 },
				description: {
					component: 'First visit: pick a specialty before anything else. It can’t be dismissed.'
				}
			}
		}
	});
</script>

<Story name="Default" />
<Story name="Saving" args={{ saving: true }} />
<Story name="Save failed" args={{ error: "We couldn't save your choice. Please try again." }} />
