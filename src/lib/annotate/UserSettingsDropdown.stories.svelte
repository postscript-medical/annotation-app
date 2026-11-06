<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { userSettingsDropdownDrawerOpen } from '#lib/sketchpad/stores.ts';
	import UserSettingsDropdown from './UserSettingsDropdown.svelte';

	const { Story } = defineMeta({
		title: 'Annotation/Account/UserSettingsDropdown',
		component: UserSettingsDropdown,
		render: template,
		args: { initial: 'S' },
		beforeEach: () => userSettingsDropdownDrawerOpen.set(false),
		parameters: {
			docs: {
				story: { inline: false, iframeHeight: 240, autoplay: true },
				description: { component: 'The user menu: the account page and sign out.' }
			}
		}
	});
</script>

{#snippet template(args: { initial: string })}
	<div class="frame"><UserSettingsDropdown {...args} /></div>
{/snippet}

<Story name="Closed" />
<!-- Opened after mounting: the menu's content only appears through its intro transition. -->
<Story name="Open" play={() => userSettingsDropdownDrawerOpen.set(true)} />

<style>
	.frame {
		display: flex;
		justify-content: flex-end;
	}
</style>
