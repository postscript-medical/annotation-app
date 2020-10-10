<script>
  import { createEventDispatcher } from 'svelte';
  export let label;
  export let disabled;
  export let options = [];
  export let selected;

  const dispatch = createEventDispatcher();

  function onChange (e) {
    dispatch('change', this.value);
  };
</script>

<label>
  { #if label }
    <span>
      { label }
    </span>
  {   /if }
  <!-- svelte-ignore a11y-no-onchange -->
  <select
      { disabled }
      bind:value={ selected }
      on:change={ onChange }
    >
      { #each options as option }
        <option
          value={ option }
        >
          { option }
        </option>
      { /each }
  </select>
</label>


<style>
  label {
    display: flex;
    flex-direction: column;
  }

  label > span {
    margin-bottom: 0.5rem;
  }
</style>