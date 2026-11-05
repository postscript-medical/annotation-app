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
		border-radius: 0.25rem;
		border: 4px solid rgba(42, 41, 41, 0);
		opacity: 0;
		transition: opacity 1s ease-out;
	}

	img.selected {
		border-color: rgba(42, 41, 41, 1);
	}

	img.loaded {
		opacity: 1;
	}
</style>
