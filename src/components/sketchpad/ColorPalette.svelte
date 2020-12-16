<script>
  import { createEventDispatcher } from "svelte";
  export let colors = [];
  export let selected;

  const dispatch = createEventDispatcher();

  function changeColor() {
    dispatch("change", this.value);
  }
</script>

<div class="colors-palette shadow">
  {#each colors as color}
    <label id={'palette-' + color.id}>
      <input
        name="color-palette"
        type="radio"
        value={color.value}
        on:change={changeColor} />
      <svg class="tool-icon" viewBox="0 0 100 100" width="24px" height="24px">
        {#if selected === color.value}
          <circle cx="50" cy="50" r="60" stroke={color.value} fill="none" />
        {/if}
        <circle cx="50" cy="50" r="50" fill={color.value} />
      </svg>
    </label>
  {/each}
</div>

<style>
  .colors-palette {
    background-color: white;
    border-radius: 1.5rem;
    display: flex;
    align-items: center;
  }

  svg {
    overflow: visible;
  }

  circle {
    stroke-width: 0.5rem;
  }

  @media screen and (min-width: 900px) {
    .colors-palette {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
