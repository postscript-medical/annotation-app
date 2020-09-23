<script>
  import { createEventDispatcher } from 'svelte';

  export let options = [];

  const dispatch = createEventDispatcher();
  let selected;

  function selectionChange () {
    dispatch('update', selected);
  }
</script>

<select bind:value={ selected } on:change={ selectionChange }>
  <option>Please choose an image</option>
  { #each options as option }
  <option value={ option.id }>
   { option.title }
  </option>
  { /each }
</select>