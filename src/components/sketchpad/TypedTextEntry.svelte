<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { EVENTS_TOUCH } from '../../constants/defaults.js';
  import ButtonIcon from './ButtonIcon.svelte';
  import IconClose from '../icons/IconClose.svelte';
  import DragHandle from './DragHandle.svelte';

  export let content;
  export let eventType = EVENTS_TOUCH;
  export let index = 1;
  export let x = 0;
  export let y = 0;
  export let color;

  const dispatch = createEventDispatcher();
  let container;
  let boundingRect;

  $: style = `transform: translate3d(${x}px,${y}px,0px)`;

 function closeEntry () {
    dispatch('close', { index });
  };

  function checkForEnter (event) {
    if (event.keyCode === 13) {
      document.activeElement.blur();
    }
  };

  function updateContent ({ target }) {
    dispatch('input', { index, content: target.value });
  }

  onMount(() => {
    console.log('mount', container);
    boundingRect = container.getBoundingClientRect();

  });
</script>

<div
  bind:this={ container }
  class="typed-text-entry"
  { style }
>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    autofocus
    value={ content }
    type="text"
    class="typed-annotation"
    style={ `color: ${color};` }
    on:input={ updateContent }
    on:keyup|preventDefault={ checkForEnter }
  />
  <DragHandle
    { boundingRect }
    { eventType }
    { index }
    on:drag
  />
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
</style>