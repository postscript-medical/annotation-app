<script>
    import {
      createEventDispatcher,
      onDestroy,
      onMount,
  } from 'svelte';
  import IconDrag from '../icons/IconDrag.svelte';

  export let index;
  export let eventType;

  const dispatch = createEventDispatcher();
  let dragHandler;

  function startDrag () {
    dispatch('drag', { index, active: true });

    dragHandler.addEventListener(eventType.up, stopDrag, false);
  };

  function stopDrag () {
    dispatch('drag', { index, active: false });

    dragHandler.removeEventListener(eventType.up, stopDrag, false);
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