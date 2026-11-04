<script lang="ts">
	import { DEFAULT_SIZE, SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL, type Size } from './sizes';
	import Icon from './Icon.svelte';

	let { size = DEFAULT_SIZE }: { size?: Size } = $props();
</script>

<Icon>
	<title>Icon: eraser size</title>
	{#if size === SIZE_SMALL}
		<circle cx="12" cy="12" r="6" />
	{:else if size === SIZE_MEDIUM}
		<circle cx="12" cy="12" r="9" />
	{:else if size === SIZE_LARGE}
		<circle cx="12" cy="12" r="12" />
	{/if}
</Icon>
