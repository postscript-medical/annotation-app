<script>
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { expoInOut } from "svelte/easing";
  import {
    illustrationSearchQuery,
    protectedContent,
    specialties,
    subSpecialties,
  } from "../stores.js";
  import findIllustrations from "../methods/find-illustrations.js";
  import filterSortIllustrations from "../methods/filter-sort-illustrations.js";
  import IconClose from "./icons/IconClose.svelte";
  import ImagesGrid from "../components/ImagesGrid.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";
  import PsTooltip from "./PsTooltip.svelte";

  const dispatch = createEventDispatcher();

  let position = { x: 0, y: 0 };
  let showTooltip = false;
  let specialtyId = $protectedContent.appState.specialty.id;
  let subSpecialtyId = $protectedContent.appState.subSpecialty.id;
  let _subSpecialties = $subSpecialties;

  $: hasSpecialties = $specialties && $specialties.length;
  $: hasSubSpecialties =
    hasSpecialties && _subSpecialties && _subSpecialties.length;
  $: illustrations = findIllustrations(_subSpecialties, subSpecialtyId);
  $: filteredIllustrations = filterSortIllustrations(
    illustrations,
    $illustrationSearchQuery
  );

  function close() {
    showTooltip = false;

    dispatch("close");
  }

  function handleEnter() {
    const { left, top, width, height } = this.getBoundingClientRect();

    position = {
      x: left - width * 4,
      y: top + height * 0.5,
    };

    showTooltip = true;
  }

  function handleLeave() {
    showTooltip = false;
  }

  function updateSubSpecialties() {
    _subSpecialties = $specialties.find(
      ({ id }) => specialtyId === id
    ).subSpecialties;

    subSpecialtyId = _subSpecialties[0].id;
  }

  function selectIllustration({ detail: illustration }) {
    dispatch("select-illustration", {
      illustration,
      specialtyId,
      subSpecialtyId,
    });
  }
</script>

<div class="wrapper">
  <div
    class="image-catalogue shadow"
    transition:fly={{ x: "100%", duration: 1000, easing: expoInOut }}
  >
    <header>
      <h2>Illustration catalogue</h2>

      <button
        class="close"
        type="button"
        data-testid="close-catalogue"
        on:click={close}
        on:pointerenter={handleEnter}
        on:pointerleave={handleLeave}
      >
        <IconClose />
      </button>

      {#if showTooltip}
        <PsTooltip x={position.x} y={position.y}>Close</PsTooltip>
      {/if}
    </header>

    <div class="body">
      {#if hasSpecialties}
        <PsDropdown
          options={$specialties.map(({ id: value, name: label }) => ({
            label,
            value,
          }))}
          bind:value={specialtyId}
          style="vertical"
          on:change={updateSubSpecialties}
        >
          Specialty
        </PsDropdown>
      {/if}

      {#if hasSubSpecialties}
        <PsDropdown
          disabled={_subSpecialties.length <= 1}
          options={_subSpecialties.map(({ id: value, name: label }) => ({
            label,
            value,
          }))}
          bind:value={subSpecialtyId}
          style="vertical"
        >
          Sub-specialty
        </PsDropdown>
      {/if}

      <input
        type="text"
        placeholder="What are you looking for?"
        class="image-search"
        bind:value={$illustrationSearchQuery}
      />

      <ImagesGrid
        activeImage={$protectedContent.appState.illustration}
        images={filteredIllustrations}
        on:select-illustration={selectIllustration}
      />
    </div>
  </div>
</div>

<style>
  /* Base styling */
  .wrapper {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 3;
    overflow: hidden;
  }

  .image-catalogue {
    background-color: white;
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 2rem;
    position: absolute;
    right: 0;
    top: 0;
    width: 100vw;
  }

  .image-catalogue > :first-child {
    display: flex;
    gap: 2rem;
    justify-content: space-between;
    margin-bottom: 2rem;
    margin-top: 1rem;
  }

  .close {
    border: 0;
    background: transparent;
    padding: 0;
  }

  /* IE11 */
  .body > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }

  /* Modern browsers */
  @supports (display: grid) {
    .body {
      display: grid;
      gap: 1rem;
      grid-auto-rows: min-content;
      grid-template-columns: 1fr 1fr;
      overflow-y: auto;
    }

    .body > :global(:not(:last-child)) {
      margin-bottom: 0;
    }

    .body > :global(:nth-child(3)),
    .body > :global(:nth-child(4)) {
      grid-column: 1 / -1;
    }

    .image-catalogue > :first-child {
      display: grid;
      grid-template-columns: 1fr min-content;
    }
  }
</style>
