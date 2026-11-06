<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<Icon title="Icon: drag">
	<path
		d="M12,2 L12,22 M2,12 L22,12 M8,5 L12,2 L16,5 M19,8 L22,12 L19,16 M16,19 L12,22 L8,19 M5,16 L2,12 L5,8"
	/>
</Icon>

<style>
	path {
		fill: none;
		stroke-width: 2;
		stroke: var(--color-black);
		stroke-linecap: round;
	}
</style>
