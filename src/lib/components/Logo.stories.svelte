<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Logo from './Logo.svelte';

	const { Story } = defineMeta({
		title: 'Components/Brand/Logo',
		component: Logo,
		argTypes: {
			style: {
				control: 'select',
				options: [
					'x-small full-color',
					'small full-color',
					'medium full-color',
					'large full-color',
					'x-small white',
					'small white',
					'medium white',
					'large white'
				]
			}
		},
		parameters: {
			docs: {
				description: {
					component:
						'The PostScript Medical logo. Full colour on white, white on the green pages. The logo’s own green and ink are artwork, separate from the interface colours.'
				}
			}
		}
	});
</script>

<Story name="Mark" />
<Story name="With name" args={{ showName: true, style: 'large full-color' }} />
<Story
	name="White on brand"
	args={{ showName: true, style: 'large white' }}
	globals={{ backgrounds: { value: 'brand' } }}
/>
<Story name="Extra small" args={{ style: 'x-small full-color' }} />
