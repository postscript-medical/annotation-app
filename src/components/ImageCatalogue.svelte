<script>
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { expoInOut } from "svelte/easing";
  import {
    illustrationSearchQuery,
    specialties,
    subSpecialties,
    selectedIllustration,
    selectedSpecialty,
    selectedSubSpecialty,
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

  // Make these reactive to store changes
  $: selectedSpecialtyName = $selectedSpecialty;
  $: selectedSubSpecialtyName = $selectedSubSpecialty;
  $: _subSpecialties = $subSpecialties;

  // Ensure sub-specialties are updated when specialty changes
  $: if (selectedSpecialtyName && $specialties) {
    const specialty = $specialties.find(
      ({ name }) => name === selectedSpecialtyName
    );
    if (specialty && specialty.subSpecialties) {
      _subSpecialties = specialty.subSpecialties;

      // Try to preserve the current sub-specialty selection if it's valid
      const currentSubSpecialty = _subSpecialties.find(
        ({ name }) => name === selectedSubSpecialtyName
      );

      if (!currentSubSpecialty && _subSpecialties.length > 0) {
        // If current selection is invalid, use the first available
        selectedSubSpecialtyName = _subSpecialties[0].name;
      }
    }
  }

  $: hasSpecialties = $specialties && $specialties.length;
  $: hasSubSpecialties =
    hasSpecialties && _subSpecialties && _subSpecialties.length;
  $: localIllustrations = findIllustrations(
    _subSpecialties,
    selectedSubSpecialtyName
  );
  $: filteredIllustrations = filterSortIllustrations(
    localIllustrations,
    $illustrationSearchQuery
  );

  // Ensure we only pass valid illustrations to ImagesGrid
  $: validFilteredIllustrations = filteredIllustrations.filter(
    (illustration) =>
      illustration &&
      typeof illustration === "object" &&
      illustration.name &&
      illustration.src &&
      illustration.id
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
      ({ name }) => name === selectedSpecialtyName
    ).subSpecialties;

    // Try to preserve the currently selected sub-specialty if it exists in the new specialty
    const currentSubSpecialty = _subSpecialties.find(
      ({ name }) => name === selectedSubSpecialtyName
    );

    if (currentSubSpecialty) {
      // Keep the current selection if it's valid for the new specialty
      selectedSubSpecialtyName = currentSubSpecialty.name;
    } else {
      // Fall back to the first sub-specialty if the current one doesn't exist
      selectedSubSpecialtyName = _subSpecialties[0].name;
    }
  }

  function selectIllustration({ detail: illustration }) {
    dispatch("select-illustration", {
      illustration,
      specialtyName: selectedSpecialtyName,
      subSpecialtyName: selectedSubSpecialtyName,
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
          options={$specialties.map(({ name: label }) => ({
            label,
            value: label,
          }))}
          bind:value={selectedSpecialtyName}
          style="vertical"
          on:change={updateSubSpecialties}
        >
          Specialty
        </PsDropdown>
      {/if}

      {#if hasSubSpecialties}
        <PsDropdown
          disabled={_subSpecialties.length <= 1}
          options={_subSpecialties.map(({ name: label }) => ({
            label,
            value: label,
          }))}
          bind:value={selectedSubSpecialtyName}
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
        activeImage={$selectedIllustration}
        images={validFilteredIllustrations}
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
