<script>
  import { createEventDispatcher } from 'svelte';
  import ButtonIcon from './ButtonIcon.svelte';

  export let toolName;
  export let primaryValue = undefined;
  export let secondaryTools = [];
  export let secondaryValue = undefined;

  const dispatch = createEventDispatcher();

  let openDrawer = false;

  $: isSelected = primaryValue === toolName;
  $: showSecondaryTools = openDrawer && (secondaryTools.length > 0) && isSelected;

  function changePrimary ({ detail: newTool }) {
    if (secondaryTools.length < 1) {
      dispatch('change-primary', newTool);

      return;
    }

    if (isSelected) {
      openDrawer = !openDrawer;
    } else {
      dispatch('change-primary', newTool);
    }
  }

  function changeSecondary (value, id) {
    dispatch('change-secondary', { value, id });

    openDrawer = false;
  }

</script>

<div
  class="primary-tool "
>
  <ButtonIcon
    on:click={ changePrimary }
    onDark={ isSelected }
    value={ toolName }
  >
    <slot
      onDark={ isSelected }
    >
      !!
    </slot>
  </ButtonIcon>
  { #if showSecondaryTools }
    <div
      class="secondary-tools shadow"
    >
      { #each secondaryTools as secondaryTool }
        <label
          id={ secondaryTool.id }
          class:on-dark={ secondaryTool.value === secondaryValue }
        >
          <input
            name={ 'secondary-' + toolName }
            type="radio"
            value={ secondaryTool.value }
            on:change={ changeSecondary(secondaryTool.value, secondaryTool.id) }
          />
          <slot
            name="secondary-tool"
            onDark={ secondaryTool.value === secondaryValue }
            { secondaryTool }
          ></slot>
        </label>
      { /each }
    </div>
  { /if }
</div>

<style>
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
    display: flex;
    flex-direction: column;
    padding: 0.375rem;
    position: absolute;
    left: 115%;
    top: 0;
  }

  .secondary-tools > :global(*) {
    background-color: white;
    border: 0;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
  }
  .secondary-tools > :global(*:last-of-type) {
    margin-bottom: 0;
  }

  .secondary-tools > :global(*.on-dark) {
    background-color: rgb(42,41,41);
    color: white;
  }
</style>