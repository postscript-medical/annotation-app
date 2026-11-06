<script lang="ts">
	// One catalogue thumbnail (legacy ImagesGridThumbnail): lazy-loaded, fades in once loaded.
	let {
		src,
		alt = '',
		selected = false
	}: { src: string; alt?: string; selected?: boolean } = $props();

	let loaded = $state(false);
</script>

<img
	{alt}
	class="shadow"
	class:selected
	class:loaded
	loading="lazy"
	{src}
	height="220"
	width="180"
	onload={() => (loaded = true)}
/>

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: var(--radius-sm);
		border: 4px solid var(--color-ink-clear);
		opacity: 0;
		transition: opacity var(--duration-slow) ease-out;
	}

	img.selected {
		border-color: var(--color-ink);
	}

	img.loaded {
		opacity: 1;
	}
</style>
