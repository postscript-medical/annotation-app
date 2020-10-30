<script>
  import { createEventDispatcher } from 'svelte';
  import {
    toolDrawerOpen,
    userSettingsDropdownDrawerOpen,
    viewportType
  } from '../../stores.js';
  import {
    VIEWPORT_PHONE,
    VIEWPORT_TABLET
  } from '../../constants/defaults.js';
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
    let scale = 'scaleX';
    let scaleDirection = '0% 0%'
    let move = 'xPercent';
    let moveDirection = -50;

    if([VIEWPORT_PHONE, VIEWPORT_TABLET].find(type => type === $viewportType)) {
      scale = 'scaleY';
      scaleDirection = '0% 100%';
      move = 'yPercent';
      moveDirection = 50;

      gsap.set(node, { yPercent: -100 });
    }

    tl
      .from(secondaryToolsContainer, {
        duration: 0.15,
        [scale]: 0,
        transformOrigin: scaleDirection,
        ease: 'circ.inOut',
      })
      .from(secondaryToolsContainer.children, {
        duration: 0.15,
        opacity: 0,
        [move]: moveDirection,
        ease: 'circ.inOut',
        stagger: 0.05,
      }, '-=0.075')

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
    left: 0;
    top: -15%;
    overflow: hidden;
  }

  .secondary-tools > :global(*) {
    background-color: white;
    border: 0;
    border-radius: 0.25rem;
  }
  .secondary-tools > :global(:not(:last-child)) {
    margin-bottom: 0.5rem;
  }

  .secondary-tools > :global(*.on-dark) {
    background-color: rgb(42,41,41);
    color: white;
  }

  @media screen and (min-width: 900px) {
    .secondary-tools {
      /* flex-direction: column; */
      left: 115%;
      top: 0;
    }

    /* .secondary-tools > :global(:not(:last-child)) {
      margin-right: 0;
      margin-bottom: 0.5rem;
    } */
  }
</style>