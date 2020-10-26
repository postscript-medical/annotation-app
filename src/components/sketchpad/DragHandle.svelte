<script>
    import {
      createEventDispatcher,
      onDestroy,
      onMount,
  } from 'svelte';
  import IconDrag from '../icons/IconDrag.svelte';

  export let index;
  export let eventType;
  export let boundingRect = { width: 0, height: 0 };

  const dispatch = createEventDispatcher();
  let dragHandler;

  $: width = boundingRect.width;
  $: height = boundingRect.height;

  function startDrag () {
    dispatch('drag', { index, active: true, width, height });

    window.addEventListener(eventType.up, stopDrag, false);
  };

  function stopDrag () {
    dispatch('drag', { index, active: false });

    window.removeEventListener(eventType.up, stopDrag, false);
  };

  onMount(() => {
    dragHandler.addEventListener(eventType.down, startDrag, false);
  });

  onDestroy(() => {
    dragHandler.removeEventListener(eventType.down, startDrag, false);
  });
</script>

<button
  bind:this={ dragHandler }
  class="drag-handle shadow"
>
  <IconDrag />
</button>

<style>
  .drag-handle {
    background: white;
    text-align: center;
    cursor: grab;
    left: 0;
    border-radius: 50%;
    pointer-events: auto;
    padding: 0.75rem;
  }
</style>