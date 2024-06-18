<script>
  import { onDestroy, onMount } from "svelte";

  export let target = undefined;

  let ref;

  onMount(() => {
    (document.querySelector(target) || document.body).appendChild(ref);
  });
</script>

<div bind:this={ref}>
  <slot />
</div>
