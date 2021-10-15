<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let value = null;
  export let onDark = false;

  function changeTool() {
    dispatch("click", value);
  }

  function handleLeave() {
    dispatch("leave");
  }

  function handleEnter() {
    dispatch("enter", this);
  }
</script>

<button
  class:on-dark={onDark}
  class="shadow"
  on:click={changeTool(value)}
  on:pointerenter={handleEnter}
  on:pointerleave={handleLeave}
>
  <slot />
</button>

<style>
  button {
    align-items: center;
    background-color: white;
    border-radius: 50%;
    border: 0;
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 0.75rem;
  }

  .on-dark {
    background-color: rgb(42, 41, 41);
    color: white;
  }
</style>
