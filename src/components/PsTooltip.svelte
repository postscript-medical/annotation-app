<script>
  import { onMount } from "svelte";
  import Portal from "./Portal.svelte";

  export let x = 0;
  export let y = 0;

  let element;
  let h;
  let posX = 0;
  let posY = 0;
  let overflowX = 0;
  let overflowY = 0;
  let w;

  onMount(() => {
    overflowX = w + x - window.innerWidth;
    overflowY = h + y - window.innerHeight;

    posX = x + 4;
    posY = y - h * 0.5;

    if (overflowX > 0) {
      posX = posX - overflowX - 4;
    }

    if (overflowY > 0) {
      posY = posY - overflowY;
    }
  });
</script>

<Portal target=".tooltip-container">
  <p
    bind:this={element}
    bind:clientHeight={h}
    bind:clientWidth={w}
    class="tooltip shadow"
    style="transform:translate({posX}px, {posY}px);"
  >
    <slot>Tooltip copy missing</slot>
  </p>
</Portal>

<style>
  .tooltip {
    background-color: white;
    border-radius: 0.5em;
    padding: 0.25em 0.5em;
    pointer-events: none;
    position: absolute;
  }
</style>
