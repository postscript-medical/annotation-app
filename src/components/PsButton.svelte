<script>
  import { createEventDispatcher } from 'svelte';

  export let autofocus = false;
  export let disabled = false;
  export let onDark = false;
  export let type = 'primary';

  $: isSecondary = type === 'secondary';

  const dispatch = createEventDispatcher();

  function click (event) {
    dispatch('click', event);
  }
</script>

<!-- svelte-ignore a11y-autofocus -->
<button
  { autofocus }
  class:secondary={ isSecondary }
  class:on-dark={ onDark }
  class:disabled={ disabled }
  { disabled }
  on:click={ click }
>
  <slot></slot>
</button>

<style>
  button {
    background-color: rgb(55, 154, 70);
    border: 0;
    color: white;
  }

  button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.on-dark {
    background-color: white;
    color: rgb(42,41,41);
  }

  button.secondary {
    background-color: white;
    border: 2px solid rgb(42,41,41);
    color: rgb(42,41,41);
  }
</style>