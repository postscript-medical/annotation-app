<script>
  import { createEventDispatcher } from 'svelte';

  export let disabled = false;
  export let asLink = false; /* TODO: this should be part of the 'style' prop, to receive either a string with a single or multiple values or an array of strings */
  export let onDark = false;
  export let style = 'primary';
  export let type = 'button';

  $: isSecondary = style === 'secondary';

  const dispatch = createEventDispatcher();

  function click (event) {
    dispatch('click', event);
  }
</script>

<!-- svelte-ignore a11y-autofocus -->
<button
  class:secondary={ isSecondary }
  class:on-dark={ onDark }
  class:disabled={ disabled }
  class:as-link={ asLink }
  { disabled }
  { type }
  on:click={ click }
>
  <slot></slot>
</button>

<style>
  button {
    background-color: rgb(55, 154, 70);
    border: 2px solid rgb(55,154,70);
    color: white;
    white-space: nowrap;
  }

  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .on-dark {
    background-color: white;
    color: rgb(42,41,41);
  }

  .secondary {
    background-color: white;
    border-color: rgb(42,41,41);
    color: rgb(42,41,41);
  }

  .as-link {
    background: none;
    padding: 0;
    border: 0;
    text-align: left;
    text-decoration: underline;
  }

  .as-link.on-dark {
    color: white;
  }
</style>