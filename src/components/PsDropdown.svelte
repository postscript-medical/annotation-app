<!-- TODO: join shared parts of this component with PsTextInput into a
shared wrapper component -->
<script>
  import { createEventDispatcher } from "svelte";
  import { DEFAULT_AXIS_DIRECTION } from "../constants/defaults.js";

  export let direction = DEFAULT_AXIS_DIRECTION;
  export let disabled = false;
  export let editable = true;
  export let options = [];
  export let optionKey = null;
  // TODO: change the below to 'value'
  export let selected = null;
  export let style = ""; /* options: ['inline', 'horizontal'|'vertical'] */

  const dispatch = createEventDispatcher();

  $: labelClass = `
    ${style}
    ${
      direction === DEFAULT_AXIS_DIRECTION ? DEFAULT_AXIS_DIRECTION : "vertical"
    }
    ${disabled ? "disabled" : ""}
  `;

  function onChange() {
    dispatch("change", this.value);
  }
</script>

{#if editable}
  <label class={labelClass}>
    <span>
      <slot />
    </span>
    <!-- svelte-ignore a11y-no-onchange -->
    <select {disabled} bind:value={selected} on:change={onChange}>
      {#each options as option}
        <option value={optionKey ? option[optionKey] : option}>
          {optionKey ? option[optionKey] : option}
        </option>
      {/each}
    </select>
  </label>
{:else}
  <span class={labelClass}>
    <span>
      <slot />
    </span>
    <span> {selected} </span>
  </span>
{/if}

<style>
  label {
    display: flex;
  }

  span {
    flex-shrink: 0;
  }

  .inline :global(select) {
    padding-left: 0;
    padding-bottom: 0;
    padding-top: 0;
    line-height: 1;
    border: 0;
    border-radius: 0;
    background-color: transparent;
    color: rgb(42, 41, 41);
  }

  .disabled {
    opacity: 0.5;
  }

  .horizontal {
    flex-direction: row;
    align-items: baseline;
  }
  .horizontal > :not(:last-child):not(:empty) {
    margin-right: 0.5rem;
  }

  .vertical {
    flex-direction: column;
    align-items: flex-start;
  }
  .vertical > :not(:last-child):not(:empty) {
    margin-bottom: 0.25rem;
  }
</style>
