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
  import { illustrationLoaded } from '../../stores.js';

  export let src = '';

  let illustration;

  async function imageLoaded () {
    gsap
      .to(illustration, 
        {
          duration: 0.15,
          opacity: 1,
          ease: 'power4.in'
        }
      );
  }

  onMount(() => {
    target = illustration;

    illustration.addEventListener('load', imageLoaded);
  });

  onDestroy(() => {
    illustration.removeEventListener('load', imageLoaded);
  })
</script>

<img
  bind:this={ illustration }
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