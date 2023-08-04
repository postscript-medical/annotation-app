<script>
  import { createEventDispatcher } from "svelte";
  import {
    illustrationSearchQuery,
    protectedContent,
    specialties,
    subSpecialties,
  } from "../stores.js";
  import ImagesGrid from "../components/ImagesGrid.svelte";
  import Modal from "./Modal.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";

  const dispatch = createEventDispatcher();

  let specialty = $protectedContent.appState.selectedSpecialty;
  let subSpecialty = $protectedContent.appState.selectedSubSpecialty;

  $: hasSpecialties = $specialties && $specialties.length;
  $: hasSubSpecialties =
    hasSpecialties && $subSpecialties && $subSpecialties.length;
  $: illustrations = findIllustrations($subSpecialties, subSpecialty);
  $: filteredIllustrations = getIllustrations(
    illustrations,
    $illustrationSearchQuery
  );

  function findIllustrations(_subSpecialties, _subSpecialty) {
    return _subSpecialties.find(
      ({ name }) => name.toLowerCase() === _subSpecialty.toLowerCase()
    ).illustrations;
  }

  function getIllustrations(array, query) {
    const filtered = query ? filterIllustrations(array, query) : array;

    return filtered.sort((el1, el2) => {
      const name1 = el1.name.toLowerCase();
      const name2 = el2.name.toLowerCase();

      if (name1 < name2) return -1;
      if (name1 > name2) return 1;

      return 0;
    });
  }

  function filterIllustrations(array, query) {
    return array.filter(({ name, alias }) => {
      return (
        name.toLowerCase().includes(query.toLowerCase()) ||
        alias.find((entry) => entry.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }

  function updateSubSpecialty() {
    subSpecialty = $subSpecialties[0].name;
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
        on:change={updateSubSpecialty}
      >
        Specialty
      </PsDropdown>
    {/if}

    {#if hasSubSpecialties}
      <PsDropdown
        disabled={$subSpecialties.length === 0}
        options={$subSpecialties}
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
