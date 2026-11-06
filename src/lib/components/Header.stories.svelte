<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './Button.svelte';
	import Header from './Header.svelte';

	const { Story } = defineMeta({
		title: 'Components/Brand/Header',
		component: Header,
		argTypes: { actions: { control: false } },
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'The page header: the logo, linking to the app except on the annotation page itself, and an `actions` area. Signed out it shows the large logo with the name, signed in the small mark. `onLight` gives the full-colour logo for a white background.'
				}
			}
		}
	});
</script>

<Story name="Signed out" globals={{ backgrounds: { value: 'brand' } }} />
<Story name="Signed in" args={{ signedIn: true }} globals={{ backgrounds: { value: 'brand' } }} />
<Story name="With actions, on light" args={{ signedIn: true, onLight: true }}>
	{#snippet template(args)}
		<Header {...args}>
			{#snippet actions()}
				<Button style="tertiary">Feedback?</Button>
				<Button style="tertiary">Share annotation</Button>
			{/snippet}
		</Header>
	{/snippet}
</Story>
