<script>
  import { createEventDispatcher } from "svelte";
  import Portal from "svelte-portal";
  import PsTooltip from "./PsTooltip.svelte";

  export let color = "#000000";
  export let tooltip = "";

  const dispatch = createEventDispatcher();

  let showTooltip = false;
  let position = { x: 0, y: 0 };

  function handleChange() {
    dispatch("change", color);
  }

  function handleEnter() {
    const { left, top, width, height } = this.getBoundingClientRect();

    position = {
      x: left + width,
      y: top + height / 2,
    };

    showTooltip = true;
  }

  function handleLeave() {
    showTooltip = false;
  }
</script>

<label
  class="color-wheel shadow"
  on:pointerenter={handleEnter}
  on:pointerleave={handleLeave}
>
  <input type="color" bind:value={color} on:input={handleChange} />

  <svg class="tool-icon" viewBox="0 0 100 100" width="24px" height="24px">
    <circle cx="50" cy="50" r="60" stroke="#000000" fill="none" />
    <circle cx="50" cy="50" r="50" fill={color} />
  </svg>
</label>

{#if tooltip && showTooltip}
  <Portal target=".tooltip-container">
    <PsTooltip x={position.x} y={position.y}>
      {tooltip}
    </PsTooltip>
  </Portal>
{/if}

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
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .color-wheel {
    background-color: white;
    border-radius: 1.5rem;
    cursor: pointer;
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
