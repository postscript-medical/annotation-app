<script>
  import {
    createEventDispatcher,
    onMount
  } from 'svelte';
  import { selectedIllustrationTitle } from '../stores.js';
  import IntersectionObserver from './IntersectionObserver.svelte';
  import ImagesGridThumbnail from './ImagesGridThumbnail.svelte';

  export let images = [];
  let nativeLoading = false;

  const URL_PATH = 'images/c_thumb,h_220,w_180/postscript-medical/annotation-app/illustrations/gastroenterology/';
  const IMAGE_SIZE = '1920x1080/';
  const dispatch = createEventDispatcher();

  $: noImages = images.length === 0;

  function selectIllustration (title) {
    dispatch('select-illustration', title);
    dispatch('close');
  }

  onMount(() => {
    // Determine whether to bypass the intersecting check
    if ('loading' in HTMLImageElement.prototype) {
      nativeLoading = true;
    }
  });
</script>

{ #if noImages }
  <div class="no-results">
    No results found...
  </div>
{ :else }
<div class="images-grid">
  { #each images as image (image.title) }
    <button
      class="card"
      on:click={ selectIllustration(image.title) }
    >
      <IntersectionObserver
        once
        let:intersecting={ intersecting }
      >
        {#if nativeLoading || intersecting}
          <ImagesGridThumbnail
            src={ URL_PATH + IMAGE_SIZE + image.src }
            alt={ image.title }
            selected={ $selectedIllustrationTitle === image.title }
          />
        { /if }
      </IntersectionObserver>
      { image.title }
    </button>
  { /each }
</div>
{ /if }

<style>
  .images-grid {
    align-items: start;
    overflow: auto;
    display: grid;
    gap: 2rem 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));
    margin-bottom: 1rem;
    padding: 0.25rem;
  }

  .card {
    width: 100%;
    border: 0;
    background-color: transparent;
    margin: 0;
    padding: 0;
    overflow: visible;
    padding: 0.5rem;
    text-align: left;
  }

  .card > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }
</style>