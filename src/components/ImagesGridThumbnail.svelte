<script>
  import { onMount } from "svelte";

  export let src;
  export let alt = "";
  export let selected = false;

  let loaded = false;
  let thisImage;

  onMount(() => {
    thisImage.onload = () => {
      loaded = true;
    };
  });
</script>

<img
  bind:this={thisImage}
  {alt}
  class="shadow"
  class:selected
  class:loaded
  loading="lazy"
  {src}
  height="220"
  width="180"
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
