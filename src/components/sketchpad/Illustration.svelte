<script context="module">
  let target;

  export function tweenOut (callback) {
    gsap
      .to(target, 
        {
          duration: 0.15,
          opacity: 0,
          onComplete: () => {
            callback()
          }
        }
      )
  };
</script>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { illustrationLoaded, illustrationDisplayed } from '../../stores.js';

  export let src = '';

  async function imageLoaded () {
    gsap
      .to($illustrationDisplayed, 
        {
          duration: 0.15,
          opacity: 1,
          ease: 'power4.in'
        }
      );
  }

  onMount(() => {
    target = $illustrationDisplayed;

    $illustrationDisplayed.addEventListener('load', imageLoaded);
  });

  onDestroy(() => {
    $illustrationDisplayed.removeEventListener('load', imageLoaded);
  })
</script>

<img
  bind:this={ $illustrationDisplayed }
  { src }
  alt=""
/>

<style>
  img {
    display: block;
    width: 100%;
    height: auto;
    opacity: 0;
  }
</style>