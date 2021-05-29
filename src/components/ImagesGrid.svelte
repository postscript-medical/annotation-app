<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { selectedIllustrationTitle } from "../stores.js";
  import IntersectionObserver from "./IntersectionObserver.svelte";
  import ImagesGridThumbnail from "./ImagesGridThumbnail.svelte";

  export let images = [];
  let nativeLoading = false;

  const URL_PATH = "images/c_thumb,h_220,w_180/annotation-app/illustrations/";
  const dispatch = createEventDispatcher();

  $: noImages = images.length === 0;

  function selectIllustration(title) {
    dispatch("select-illustration", title);

    dispatch("close");
  }

  onMount(() => {
    // Determine whether to bypass the intersecting check
    if ("loading" in HTMLImageElement.prototype) {
      nativeLoading = true;
    }
  });
</script>

{#if noImages}
  <div class="no-results">No results found...</div>
{:else}
  <div class="scrollable-container">
    <div class="images-grid">
      {#each images as image (image.name)}
        <button class="card" on:click={selectIllustration(image.name)}>
          <IntersectionObserver once let:intersecting>
            {#if nativeLoading || intersecting}
              <ImagesGridThumbnail
                src={URL_PATH + image.src}
                alt={image.name}
                selected={$selectedIllustrationTitle === image.name} />
            {/if}
          </IntersectionObserver>
          {image.name}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .scrollable-container {
    overflow: auto;
  }
  .images-grid {
    align-items: start;
    display: grid;
    gap: 2rem 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));
  }

  .card {
    width: 100%;
    border: 0;
    background-color: transparent;
    margin: 0;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.5rem;
    text-align: left;
  }

  .card > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }

  @media screen and (min-width: 900px) {
    .scrollable-container {
      grid-row: 2 / span 3;
      grid-column-start: 2;
    }
  }

  @media screen and (min-width: 1200px) {
    .images-grid {
      grid-template-columns: repeat(auto-fill, minmax(min(13rem, 100%), 1fr));
    }
  }
</style>
