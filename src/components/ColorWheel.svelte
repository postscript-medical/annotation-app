<script>
  import { createEventDispatcher } from "svelte";

  export let color = "#000000";

  const dispatch = createEventDispatcher();

  function handleChange() {
    dispatch("change", color);
  }
</script>

<label class="color-wheel shadow">
  <input type="color" bind:value={color} on:input={handleChange} />

  <svg class="tool-icon" viewBox="0 0 100 100" width="24px" height="24px">
    <circle cx="50" cy="50" r="60" stroke="#000000" fill="none" />
    <circle cx="50" cy="50" r="50" fill={color} />
  </svg>
</label>

<style>
  svg {
    overflow: visible;
  }

  circle {
    stroke-width: 0.5rem;
  }

  input[type="color"] {
    position: absolute;
    opacity: 0;
  }

  .color-wheel {
    background-color: white;
    border-radius: 1.5rem;
    /*
     * IE does not support input[type="color"]
    */
    display: none;
  }

  /* Modern browsers */
  @supports (display: grid) {
    .color-wheel {
      display: unset;
    }
  }
</style>
