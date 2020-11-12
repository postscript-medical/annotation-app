<!-- TODO: join shared parts of this component with PsTextInput into a
shared wrapper component -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { DEFAULT_AXIS_DIRECTION } from '../constants/defaults.js';

  export let direction = DEFAULT_AXIS_DIRECTION;
  export let disabled = false;
  export let options = [];
  export let optionKey = undefined;
  export let selected = undefined;

  const dispatch = createEventDispatcher();

  $: labelClass = `
    ${direction === DEFAULT_AXIS_DIRECTION ? DEFAULT_AXIS_DIRECTION : 'vertical'}
    ${disabled ? 'disabled' : ''}
  `;

  function onChange (e) {
    dispatch('change', this.value);
  };
</script>

<label
  class={ labelClass }
>
    <span>
      <slot></slot>
    </span>
  <!-- svelte-ignore a11y-no-onchange -->
  <select
      { disabled }
      bind:value={ selected }
      on:change={ onChange }
    >
      { #each options as option }
        <option
          value={ optionKey ? option[optionKey] : option }
        >
          { optionKey ? option[optionKey] : option }
        </option>
      { /each }
  </select>
</label>


<style>
  label {
    display: flex;
  }

  span {
    flex-shrink: 0;
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
  }
  .vertical > :not(:last-child):not(:empty) {
    margin-bottom: 0.25rem;
  }
</style>