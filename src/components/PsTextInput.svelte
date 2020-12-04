<!-- TODO: Implement at some point -->
<!-- type = ['text', 'email', 'password'] -->
<!-- TODO: We need an option for the input not to be nested inside the label
to allow for grid layouts to be implemented -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { DEFAULT_AXIS_DIRECTION } from '../constants/defaults.js';

  export let direction = DEFAULT_AXIS_DIRECTION;
  export let disabled = false;
  export let readonly = false;
  export let placeholder = '';
  export let value = '';
  export let style = ''; /* options: 'inline' */
  export let size = 20;

  const dispatch = createEventDispatcher();

  $: labelClass = `
    container
    ${style}
    ${direction === DEFAULT_AXIS_DIRECTION ? DEFAULT_AXIS_DIRECTION : 'vertical'}
    ${disabled ? 'disabled' : ''}
  `;

  function onInput ({ target }) {
    dispatch('input', target.value);
  };

  function onBlur (event) {
    dispatch('blur', event);
  };
</script>

<label
  class={ labelClass }
>
    <span>
      <slot></slot>
    </span>
    <input
      type="text"
      { value }
      { placeholder }
      { disabled }
      { size }
      { readonly }
      on:input={ onInput }
      on:blur={ onBlur }
    >
</label>


<style>
  input[type="text"] {
    padding: 0.25rem;
  }
  input:read-only {
    /* border-color: transparent; */
    background-color: transparent;
  }

  span {
    flex-shrink: 0;
  }

  .container {
    display: flex;
    align-items: flex-start;
  }

  .inline :global(input) {
    border-left: 0;
    border-right: 0;
    border-top: 0;
    border-radius: 0;
    line-height: 1;
    padding: 0;
    flex: 0;
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