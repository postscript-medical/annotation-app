<script>
  import { createEventDispatcher } from "svelte";
  import { selectedIllustrationTitle } from "../stores.js";
  import IntersectionObserver from "./IntersectionObserver.svelte";
  import ImagesGridThumbnail from "./ImagesGridThumbnail.svelte";

  export let images = [];
  let nativeLoading = false;

  const URL_PATH = "images/c_thumb,h_220,w_180/annotation-app/illustrations/";
  const dispatch = createEventDispatcher();

  $: noImages = images.length === 0;

  // Determine whether to bypass the intersecting check
  if ("loading" in HTMLImageElement.prototype) {
    nativeLoading = true;
  }

  function selectIllustration(illustration) {
    dispatch("select-illustration", illustration);

    dispatch("close");
  }
</script>

{#if noImages}
  <div class="no-results">No results found...</div>
{:else}
  <div class="scrollable-container">
    <div class="images-grid">
      {#each images as image (image.name)}
        <button class="card" on:click={selectIllustration(image)}>
          <IntersectionObserver once let:intersecting>
            <!-- This is not triggering on IE -->
            <!-- {#if nativeLoading || intersecting} -->
            <ImagesGridThumbnail
              src={URL_PATH + image.src}
              alt={image.name}
              selected={$selectedIllustrationTitle === image.name}
            />
            <!-- {/if} -->
          </IntersectionObserver>
          {image.name}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Base styling */
  .card {
    background-color: transparent;
    border: 0;
    margin: 0;
    padding: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    width: 100%;
  }

  .card > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }

  .no-results {
    font-size: 3rem;
    font-weight: 600;
  }

  /* IE11 */
  .scrollable-container {
    width: 100%;
    flex-grow: 1;
  }

  .images-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .card {
    width: 25%;
    max-width: 250px;
  }

  .no-results {
    padding-top: 1rem;
    width: 100%;
    flex-grow: 1;
  }

  /* Modern browsers */
  @supports (display: grid) {
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
      width: auto;
      max-width: none;
    }

    @media screen and (min-width: 900px) {
      .scrollable-container {
        grid-row: 2 / span 3;
        grid-column-start: 2;
      }

      .no-results {
        grid-row: 2 / span 2;
        grid-column-start: 2;
      }
    }

    @media screen and (min-width: 1200px) {
      .images-grid {
        grid-template-columns: repeat(auto-fill, minmax(min(13rem, 100%), 1fr));
      }
    }
  }
</style>
