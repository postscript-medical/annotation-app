<script>
  import { createEventDispatcher } from 'svelte';
  import ToolIcon from './ToolIcon.svelte';

  export let toolName;
  export let primaryValue;
  export let secondaryTools = [];
  export let secondaryValue;

  const dispatch = createEventDispatcher();

  let openDrawer = false;

  $: isSelected = primaryValue === toolName;
  $: showSecondaryTools = openDrawer && (secondaryTools.length > 0) && isSelected;

  function changePrimary ({ detail: newTool }) {
    if (isSelected) {
      openDrawer = !openDrawer;
    } else {
      dispatch('change-primary', newTool);
    }
  }

  function changeSecondary () {
    dispatch('change-secondary', this.value);
    openDrawer = false;
  }

</script>

<div class="primary-tool">
  <ToolIcon
    on:click={ changePrimary }
    onDark={ isSelected }
    value={ toolName }
  >
    <slot>
      G
    </slot>
  </ToolIcon>
  { #if showSecondaryTools }
    <div
      class="secondary-tools"
    >
      { #each secondaryTools as tool }
        <label
          id={ tool.id }
          class:on-dark={ tool.value === secondaryValue }
        >
          <input
            name={ 'secondary-' + toolName }
            on:change={ changeSecondary }
            type="radio"
            value={ tool.value }
          />
          { tool.id }
        </label>
      { /each }
    </div>
  { /if }
</div>

<style>
  label {
    background-color: white;
    border: 0;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
  }
  label:last-of-type {
    margin-bottom: 0;
  }

  .primary-tool {
    position: relative;
    margin-bottom: 1rem;
  }

  .primary-tool:last-child {
    margin-bottom: 0;
  }

  .secondary-tools {
    background-color: white;
    border-radius: 0.375rem;
    box-shadow: 0px 0.075rem 0.25rem 0px rgba(42,41,41,0.15);
    display: flex;
    flex-direction: column;
    padding: 0.375rem;
    position: absolute;
    left: 115%;
    top: 0;
  }

  .on-dark {
    background-color: rgb(42,41,41);
    color: white;
  }
</style>