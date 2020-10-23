<script>
  import { createEventDispatcher } from 'svelte';
  import {
    onDestroy,
    onMount,
  } from 'svelte';
  import { EVENTS_TOUCH } from '../../constants/defaults.js';
  import ButtonIcon from './ButtonIcon.svelte';
  import IconClose from '../icons/IconClose.svelte';
  import IconDrag from '../icons/IconDrag.svelte';

  export let content;
  export let eventType = EVENTS_TOUCH;
  export let index = 1;
  export let x = 0;
  export let y = 0;

  const dispatch = createEventDispatcher();

  let dragHandler;

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
  });

  onDestroy(() => {
    dragHandler.removeEventListener(eventType.down, startDrag, false);
    dragHandler.removeEventListener(eventType.up, stopDrag, false);
  });
</script>

<div
  class="typed-text-entry"
  {style}
>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    autofocus
    value={ content }
    on:input={ updateContent }
    type="text"
    class="typed-annotation"
  />
  <div
    bind:this={ dragHandler }
    class="drag-handle shadow"
  >
    <IconDrag />
  </div>
  <ButtonIcon
    on:click={ closeEntry }
  >
    <IconClose />
  </ButtonIcon>
</div>

<style>
  .typed-text-entry {
    position: absolute;
    left: 0;
    top: 0;
  }

  .typed-text-entry > :global(:not(input)) {
    position: absolute;
    opacity: 0;
    transform: translate(-50%, -50%);
    top: -25%;
    transition: opacity 100ms linear;
  }

  .typed-text-entry:hover > :global(:not(input)) {
    opacity: 1;
  }

  .typed-text-entry > :global(:last-child) {
    left: 100%;
  }

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