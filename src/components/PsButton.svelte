<script>
  import { createEventDispatcher } from 'svelte';

  export let autofocus;
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