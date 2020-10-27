<script>
  import {
    filteredIllustrations,
    illustrationSearchQuery,
    selectedSpecialty,
    selectedSubSpecialty,
    specialties,
    subSpecialties,
  } from '../stores.js';
  import ImagesGrid from './ImagesGrid.svelte';
  import PsDropdown from './PsDropdown.svelte';

  export let show = false;

  function selectSpecialty ({ detail: specialty }) {
    $selectedSpecialty = specialty;
  };

  function selectSubSpecialty ({ detail: subSpecialty }) {
    $selectedSubSpecialty = subSpecialty;
  };

  function tween () {
    const tl = gsap.timeline({ paused: true });

    tl
      .from('.background', {
        duration: 0.15,
        opacity: 0,
        ease: 'none',
      })
      .from('.background > *', {
        y: 50,
        opacity: 0,
        ease: 'circ.out',
        clearProps: 'transform',
      }, '-=0.075')

    const duration = tl.totalDuration();

    return {
      duration: duration * 1000,
      tick: t => {
        tl.progress(t);
      }
    }
  }
</script>

{ #if show }
  <div
    class="background"
    transition:tween
  >
    <div class="left-column">
      <PsDropdown
        label="Specialty"
        options={ $specialties }
        on:change={ selectSpecialty }
      />
    </div>

    <div class="left-column">
      <PsDropdown
        label="Sub-specialty"
        options={ $subSpecialties }
        on:change={ selectSubSpecialty }
      />
    </div>

    <input
      type="text"
      placeholder="What are you looking for?"
      class="image-search"
      bind:value={ $illustrationSearchQuery }
    />

    <ImagesGrid
      images={ $filteredIllustrations }
      on:select-illustration
      on:close
    />
  </div>
{ /if }

<style>
  .background {
    background-color: white;
    display: grid;
    gap: 2rem 1rem;
    grid-template-columns: minmax(10ch, 40ch) minmax(10rem, 65rem);
    grid-template-rows: min-content;
    justify-content: center;
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