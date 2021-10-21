<script>
  import {
    filteredIllustrations,
    illustrationSearchQuery,
    selectedSpecialty,
    selectedSubSpecialty,
    specialties,
    subSpecialties,
  } from "../stores.js";
  import ImagesGrid from "../components/ImagesGrid.svelte";
  import Modal from "./Modal.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";

  function selectSpecialty({ detail: specialty }) {
    $selectedSpecialty = specialty;

    selectSubSpecialty({ detail: $subSpecialties[0].name });
  }

  function selectSubSpecialty({ detail: subSpecialty }) {
    $selectedSubSpecialty = subSpecialty;
  }
</script>

<Modal hideCancelButton hideConfirmButton style="extend" on:close>
  <svelte:fragment slot="header">Illustration catalog</svelte:fragment>

  <div class="body">
    <PsDropdown
      options={$specialties}
      optionKey="name"
      selected={$selectedSpecialty}
      style="vertical"
      on:change={selectSpecialty}
    >
      Specialty
    </PsDropdown>

    <PsDropdown
      disabled={$subSpecialties.length === 0}
      options={$subSpecialties}
      optionKey="name"
      selected={$selectedSubSpecialty}
      style="vertical"
      on:change={selectSubSpecialty}
    >
      Sub-specialty
    </PsDropdown>

    <input
      type="text"
      placeholder="What are you looking for?"
      class="image-search"
      bind:value={$illustrationSearchQuery}
    />

    <ImagesGrid images={$filteredIllustrations} on:select-illustration />
  </div>
</Modal>

<style>
  .body {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr;
    overflow-y: auto;
  }

  .body > :global(:nth-child(3)),
  .body > :global(:nth-child(4)) {
    grid-column: 1 / -1;
  }
</style>
