<script>
  import {
    filteredIllustrations,
    illustrationSearchQuery,
    selectedSpecialty,
    selectedSubSpecialty,
    specialties,
    subSpecialties,
  } from "../stores.js";
  import ImagesGrid from "./ImagesGrid.svelte";
  import PsDropdown from "./PsDropdown.svelte";

  export let show = false;

  function selectSpecialty({ detail: specialty }) {
    $selectedSpecialty = specialty;

    selectSubSpecialty({ detail: $subSpecialties[0].name });
  }

  function selectSubSpecialty({ detail: subSpecialty }) {
    $selectedSubSpecialty = subSpecialty;
  }

  function tween() {
    const tl = gsap.timeline({ paused: true });

    tl.from(".image-selector", {
      duration: 0.15,
      opacity: 0,
      ease: "none",
    }).from(
      ".image-selector > *",
      {
        y: 50,
        opacity: 0,
        ease: "circ.out",
        clearProps: "transform",
      },
      "-=0.075"
    );

    const duration = tl.totalDuration();

    return {
      duration: duration * 1000,
      tick: (t) => {
        tl.progress(t);
      },
    };
  }
</script>

{#if show}
  <div class="image-selector" transition:tween>
    <div class="left-column" />

    <div class="left-column">
      <PsDropdown
        options={$specialties}
        optionKey="name"
        selected={$selectedSpecialty}
        style="vertical"
        on:change={selectSpecialty}
      >
        Specialty
      </PsDropdown>
    </div>

    <div class="left-column">
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
    </div>

    <input
      type="text"
      placeholder="What are you looking for?"
      class="image-search"
      bind:value={$illustrationSearchQuery}
    />

    <ImagesGrid
      images={$filteredIllustrations}
      on:select-illustration
      on:close
    />
  </div>
{/if}

<style>
  /* Base styling */
  .image-selector {
    background-color: white;
    border-color: transparent;
    border-width: 9rem 1rem 0 1rem;
    border-style: solid;
    overflow: hidden;
    position: absolute;
    pointer-events: auto;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .left-column {
    display: none;
  }

  @media screen and (min-width: 900px) {
    .image-selector {
      border-width: 5rem 1rem 0 1rem;
    }

    .left-column {
      display: block;
    }
  }

  /* IE11 */
  .image-selector {
    overflow-y: auto;
  }

  .left-column {
    width: 25%;
    margin-right: 1rem;
    margin-bottom: 1rem;
    display: inline-block;
  }

  .image-search {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    width: calc(100% - 1rem);
  }

  /* Modern browsers */
  @supports (display: grid) {
    .image-selector {
      align-content: start;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
      grid-template-rows: min-content;
      justify-content: center;
    }

    .left-column {
      width: auto;
      margin: 0;
    }

    .image-search {
      align-self: end;
      margin: 0;
      width: auto;
    }

    @media screen and (min-width: 900px) {
      .image-selector {
        grid-template-columns: minmax(10ch, 30ch) minmax(10rem, 65rem);
      }

      .left-column {
        grid-column-start: 1;
      }
      .image-search {
        grid-column-start: 2;
        grid-row-start: 1;
      }
    }
  }
</style>
