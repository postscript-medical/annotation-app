<!-- TODO: Implement at some point -->
<!-- type = ['text', 'email', 'password'] -->
<!-- TODO: We need an option for the input not to be nested inside the label
to allow for grid layouts to be implemented -->
<script>
  import { createEventDispatcher } from 'svelte';

  const DEFAULT_DIRECTION = 'horizontal';

  export let value = '';
  export let placeholder = '';
  export let disabled = false;
  export let direction = DEFAULT_DIRECTION;

  const dispatch = createEventDispatcher();

  $: labelClass = `
    ${direction === DEFAULT_DIRECTION ? DEFAULT_DIRECTION : 'vertical'}
    ${disabled ? 'disabled' : ''}
  `;

  function onInput ({ target }) {
    dispatch('input', target.value)
  }
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
    on:input={ onInput }
  >
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
    margin-left: calc(0.6rem + 1px);
  }
</style>