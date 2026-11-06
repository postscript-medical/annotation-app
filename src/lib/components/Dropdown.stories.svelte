<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Dropdown from './Dropdown.svelte';

	const options = [
		{ label: 'Specialty one', value: 's1' },
		{ label: 'Specialty two', value: 's2' },
		{ label: 'Specialty three', value: 's3' }
	];

	const { Story } = defineMeta({
		title: 'Components/Forms/Dropdown',
		component: Dropdown,
		render: template,
		args: { options, value: 's1', onchange: fn() },
		argTypes: {
			direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
			style: { control: 'select', options: ['', 'inline'] },
			children: { control: false }
		},
		parameters: {
			docs: {
				description: {
					component: 'A labelled select. With `editable` false it shows the value as text.'
				}
			}
		}
	});
</script>

{#snippet template(args: Record<string, unknown>)}
	<Dropdown {options} {...args}>Specialty</Dropdown>
{/snippet}

<Story name="Horizontal" />
<Story name="Vertical" args={{ direction: 'vertical' }} />
<Story name="Inline" args={{ style: 'inline' }} />
<Story name="Not editable" args={{ editable: false }} />
<Story name="Disabled" args={{ disabled: true }} />
