<script>
  import { createEventDispatcher } from "svelte";
  import {
    illustrationSearchQuery,
    protectedContent,
    specialties,
    subSpecialties,
  } from "../stores.js";
  import findIllustrations from "../methods/find-illustrations.js";
  import filterSortIllustrations from "../methods/filter-sort-illustrations.js";
  import ImagesGrid from "../components/ImagesGrid.svelte";
  import Modal from "./Modal.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";

  const dispatch = createEventDispatcher();

  let specialty = $protectedContent.appState.selectedSpecialty;
  let subSpecialty = $protectedContent.appState.selectedSubSpecialty;
  let _subSpecialties = $subSpecialties;

  $: hasSpecialties = $specialties && $specialties.length;
  $: hasSubSpecialties =
    hasSpecialties && _subSpecialties && _subSpecialties.length;
  $: illustrations = findIllustrations(_subSpecialties, subSpecialty);
  $: filteredIllustrations = filterSortIllustrations(
    illustrations,
    $illustrationSearchQuery
  );

  function updateSubSpecialties() {
    _subSpecialties = $specialties.find(
      ({ name }) => specialty === name
    ).subSpecialties;
    subSpecialty = _subSpecialties[0].name;
  }

  function selectIllustration({ detail: illustration }) {
    dispatch("select-illustration", {
      illustration,
      specialty,
      subSpecialty,
    });
  }
</script>

<Modal hideCancelButton hideConfirmButton style="extend" on:close>
  <svelte:fragment slot="header">Illustration catalogue</svelte:fragment>

  <div class="body">
    {#if hasSpecialties}
      <PsDropdown
        options={$specialties}
        optionKey="name"
        bind:selected={specialty}
        style="vertical"
        on:change={updateSubSpecialties}
      >
        Specialty
      </PsDropdown>
    {/if}

    {#if hasSubSpecialties}
      <PsDropdown
        disabled={_subSpecialties.length === 0}
        options={_subSpecialties}
        optionKey="name"
        bind:selected={subSpecialty}
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
      images={filteredIllustrations}
      on:select-illustration={selectIllustration}
    />
  </div>
</Modal>

<style>
  /* Base styling */
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
  }
</style>
