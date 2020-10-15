<script>
  import {
    createEventDispatcher,
    onMount
  } from 'svelte';
  import { selectedImageTitle } from '../stores.js';

  export let images = [];

  const URL_PATH = 'images/c_thumb,h_220,w_180/postscript-medical/annotation-app/illustrations/gastroenterology/';
  const IMAGE_SIZE = '1920x1080/';
  const dispatch = createEventDispatcher();

  $: noImages = images.length === 0;

  function selectIllustration (title) {
    $selectedImageTitle = title;
    dispatch('close');
  }
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
      <img
        src={ URL_PATH + IMAGE_SIZE + image.src }
        alt={ image.title }
        class="shadow"
        class:selected={ $selectedImageTitle === image.title }
      />
      { image.title }
    </button>
  { /each }
</div>
{ /if }

<style>
  img {
    display: block;
    width: 100%;
    height: auto;
    margin-bottom: 1rem;
    border: 2px solid rgba(42,41,41,0);
  }

  img.selected {
    border-color: rgba(42,41,41,1)
  }

  .images-grid {
    align-items: start;
    overflow: auto;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(110px, 100%), 1fr));
    margin-bottom: 1rem;
    padding: 0.25rem;
  }

  .card {
    width: 100%;
    border: 0;
    background-color: transparent;
    margin: 0;
    padding: 0;
  }
</style>