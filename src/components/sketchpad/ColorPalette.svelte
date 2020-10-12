<script>
  import { createEventDispatcher } from 'svelte';
  export let colors = [];
  export let selected;

  const dispatch = createEventDispatcher();

  function changeColor () {
    dispatch('change', this.value )
  }
</script>

<div
  class="color-palette shadow"
>
  { #each colors as color }
    <label
      id={ 'palette-' + color.id }
    >
      <input
        name="color-palette"
        type="radio"
        value={ color.value }
        on:change={ changeColor }
      />
      <svg
        viewBox="0 0 100 100"
        width="100"
        height="100"
      >
        { #if selected === color.value }
          <circle
            cx="50"
            cy="50"
            r="50"
            stroke={ color.value }
            fill="none"
          />
        { /if }
        <circle
          cx="50"
          cy="50"
          r="40"
          fill={ color.value }
        />
      </svg>
    </label>
  { /each }
</div>

<style>
  .color-palette {
    background-color: white;
    padding: 0.375rem;
    border-radius: 1.5rem;
  }

  .color-palette > * {
    margin-bottom: 0.5rem;
  }

  .color-palette > *:last-child {
    margin-bottom: 0;
  }

  svg {
    display: block;
    width: 1.25rem;
    height: 1.25rem;
    overflow: visible;
  }

  circle {
    stroke-width: 0.25rem;
  }
</style>