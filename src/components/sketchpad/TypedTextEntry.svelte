<script>
  import { createEventDispatcher } from 'svelte';
  import {
    onDestroy,
    onMount,
  } from 'svelte';
  import { EVENTS_TOUCH } from '../../constants/sketch-pad.js'

  export let content;
  export let eventType = EVENTS_TOUCH;
  export let index = 1;
  export let x = 0;
  export let y = 0;

  const dispatch = createEventDispatcher();

  let dragHandler;
  let closeButton;

  $: style = `transform: translate3d(${x}px,${y}px,0px)`;

 function closeEntry () {
    dispatch('close', { index });
  };

  function startDrag () {
    dispatch('drag', { index, active: true });
  };

  function stopDrag () {
    dispatch('drag', { index, active: false });
  };

  function updateContent ({ target }) {
    dispatch('input', { index, content: target.value });
  }

  onMount(() => {
    dragHandler.addEventListener(eventType.down, startDrag, false);
    dragHandler.addEventListener(eventType.up, stopDrag, false);
    closeButton.addEventListener(eventType.up, closeEntry, false);
  });

  onDestroy(() => {
    dragHandler.removeEventListener(eventType.down, startDrag, false);
    dragHandler.removeEventListener(eventType.up, stopDrag, false);
    closeButton.removeEventListener(eventType.up, closeEntry, false);

  });
</script>

<div
  class="container"
  {style}
>
  <div
    bind:this={ dragHandler }
    class="drag-handle"
  ></div>
  <div
    bind:this={ closeButton }
    class="close-button"
  >x</div>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    autofocus
    value={ content }
    on:input={ updateContent }
    type="text"
    class="typed-annotation"
  />
</div>

<style>
  div {
    border: 1px solid rgb(55, 154, 70);
    position: absolute;
    left: 0;
    top: 0;
  }

  input {
    pointer-events: auto;
  }

  .drag-handle {
    background: white;
    text-align: center;
    cursor: grab;
    position: absolute;
    left: 0;
    top: 0;
    border: 1px solid black;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;;
    transform: translate(-50%, -50%);
    pointer-events: auto;
  }

  .close-button {
    background: white;
    text-align: center;
    cursor: pointer;
    position: absolute;
    left: 100%;
    top: 0;
    border: 1px solid black;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    transform: translate(-50%, -50%);
    pointer-events: auto;
  }
</style>