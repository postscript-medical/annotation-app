<script>
  import { createEventDispatcher } from 'svelte';
  import {
    toolDrawerOpen,
    userSettingsDropdownDrawerOpen
  } from '../../stores.js';
  import closeUserSettingsDropdown from '../../methods/closeUserSettingsDropdown.js';
  import ButtonIcon from './ButtonIcon.svelte';

  export let toolName;
  export let primaryValue = '';
  export let secondaryTools = [];
  export let secondaryValue = '';

  const dispatch = createEventDispatcher();

  let secondaryToolsContainer;

  $: openDrawer = $toolDrawerOpen === toolName;
  $: isSelected = primaryValue === toolName;
  $: showSecondaryTools = openDrawer && (secondaryTools.length > 0) && isSelected;

  function changePrimary ({ detail: newTool }) {
    $toolDrawerOpen = toolName

    closeUserSettingsDropdown();

    if (secondaryTools.length < 1) {
      dispatch('change-primary', newTool);

      return;
    }

    if (!isSelected) {
      dispatch('change-primary', newTool);
    }
  }

  function changeSecondary (value, id) {
    closeUserSettingsDropdown();

    dispatch('change-secondary', { value, id });
  }

   function tween (node) {
    const tl = gsap.timeline({ paused: true });

    tl
      .from(secondaryToolsContainer, {
        duration: 0.15,
        scaleX: 0,
        transformOrigin: '0% 0%',
        ease: 'circ.inOut',
      })
      .from(secondaryToolsContainer.children, {
        duration: 0.15,
        opacity: 0,
        xPercent: -50,
        ease: 'circ.inOut',
        stagger: 0.05,
      })

    const duration = tl.totalDuration();

    return {
      duration: duration * 1000,
      tick: t => {
        tl.progress(t);
      }
    }
  };
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
      bind:this={ secondaryToolsContainer }
      class="secondary-tools shadow"
      transition:tween
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
    overflow: hidden;
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