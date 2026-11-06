<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Link from './Link.svelte';

	const { Story } = defineMeta({
		title: 'Components/Actions/Link',
		component: Link,
		render: template,
		args: { href: '#' },
		argTypes: {
			style: { control: 'select', options: ['', 'on-dark'] },
			target: { control: 'select', options: ['_self', '_blank'] },
			children: { control: false }
		},
		parameters: {
			docs: {
				description: {
					component:
						'A styled link. Pass internal URLs through `resolve()` from `$app/paths`. A link opening a new tab gets `rel="noopener noreferrer"`.'
				}
			}
		}
	});
</script>

{#snippet template(args: Record<string, unknown>)}
	<Link href="#" {...args}>Your account</Link>
{/snippet}

<Story name="Default" />
<Story name="On dark" args={{ style: 'on-dark' }} globals={{ backgrounds: { value: 'brand' } }} />
<Story name="New tab" args={{ target: '_blank', href: 'https://example.com/' }} />
