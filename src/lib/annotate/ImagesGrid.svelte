<script lang="ts">
	import type { Illustration } from '#lib/catalogue/types.ts';
	import { thumbnailUrl } from '#lib/images.ts';
	import ImagesGridThumbnail from './ImagesGridThumbnail.svelte';

	// The catalogue's thumbnails (legacy ImagesGrid). Legacy's IntersectionObserver wrapper was
	// already disabled in favour of native lazy loading, so it isn't ported.
	let {
		images,
		activeId = null,
		disabled = false,
		onselect
	}: {
		images: Illustration[];
		activeId?: string | null;
		disabled?: boolean;
		onselect: (illustration: Illustration) => void;
	} = $props();
</script>

{#if images.length === 0}
	<div class="no-results">No results found...</div>
{:else}
	<div class="scrollable-container">
		<div class="images-grid">
			{#each images as image (image.id)}
				<button
					class="card"
					type="button"
					{disabled}
					aria-pressed={image.id === activeId}
					onclick={() => onselect(image)}
				>
					<ImagesGridThumbnail
						src={thumbnailUrl(image.src)}
						alt=""
						selected={image.id === activeId}
					/>
					{image.name}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.card {
		background-color: transparent;
		border: 0;
		margin: 0;
		max-width: none;
		overflow: hidden;
		padding: 0.5rem;
		text-align: left;
		text-overflow: ellipsis;
		width: auto;
	}

	.card:disabled {
		cursor: progress;
	}

	.card > :global(:not(:last-child)) {
		margin-bottom: 1rem;
	}

	.scrollable-container {
		flex-grow: 1;
		overflow: auto;
		width: 100%;
	}

	.images-grid {
		align-items: start;
		display: grid;
		gap: 2rem 1rem;
		grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));
	}

	.no-results {
		font-size: 3rem;
		font-weight: 600;
		grid-column: 1 / -1;
		padding-top: 1rem;
		width: 100%;
	}

	@media screen and (min-width: 1200px) {
		.images-grid {
			grid-template-columns: repeat(auto-fill, minmax(min(13rem, 100%), 1fr));
		}
	}
</style>
