<script>
  import { protectedContent } from '../stores.js';
  import ImagesGrid from './ImagesGrid.svelte';
  import PsDropdown from './PsDropdown.svelte';

  let searchQuery = '';
  let selectedSpecialty = $protectedContent.specialties[0];
  let selectedSubSpecialty = $protectedContent.subSpecialties[0];

  $: specialties = $protectedContent.specialties;
  $: subSpecialties = $protectedContent.subSpecialties;
  $: images = $protectedContent.images;
  $: preFilterImages = images
    .filter(({ specialties }) => specialties
      .find(specialty => specialty.toLowerCase() === selectedSpecialty.toLowerCase()))
    .filter(({ subSpecialties }) => subSpecialties
      .find(subSpecialty => subSpecialty.toLowerCase() === selectedSubSpecialty.toLowerCase()));
  $: filteredImages = searchQuery ? preFilterImages
    .filter(({ title }) => title.toLowerCase().includes(searchQuery.toLowerCase()))
  : preFilterImages;

  function selectSubSpecialty ({ detail: subSpecialty }) {
    selectedSubSpecialty = subSpecialty;
  };
</script>

<div class="modal">
  <div class="left-column">
    <PsDropdown
      label="Specialty"
      options={ specialties }
      disabled
    />
  </div>

  <div class="left-column">
    <PsDropdown
      label="Sub-specialty"
      options={ subSpecialties }
      on:change={ selectSubSpecialty }
    />
  </div>

  <input
    type="text"
    placeholder="What are you looking for?"
    class="image-search"
    bind:value={ searchQuery }
  />

  <ImagesGrid
    images={ filteredImages }
  />
</div>

<style>
  .modal {
    display: grid;
    gap: 2rem 1rem;
    grid-template-columns: 1fr 2fr;
    grid-template-rows: min-content;
    background-color: white;
    padding: 12rem 2rem 0;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: auto;
  }

  .left-column {
    grid-column-start: 1
  }

  .image-search {
    align-self: end;
    grid-column-start: 2;
    grid-row-start: 1;
    margin: 0;
  }
</style>