<script>
  import {
    filteredIllustrations,
    illustrationSearchQuery,
    selectedIllustrationTitle,
    selectedSpecialty,
    selectedSubSpecialty,
    specialties,
    subSpecialties,
    user,
  } from '../stores.js';
  import ImagesGrid from './ImagesGrid.svelte';
  import PsDropdown from './PsDropdown.svelte';

  export let show = false;

  function selectSpecialty ({ detail: specialty }) {
    $selectedSpecialty = specialty;

    updateUserAppMetadata();
  };

  function selectSubSpecialty ({ detail: subSpecialty }) {
    $selectedSubSpecialty = subSpecialty;

    updateUserAppMetadata();
  };

  function tween () {
    const tl = gsap.timeline({ paused: true });

    tl
      .from('.image-selector', {
        duration: 0.15,
        opacity: 0,
        ease: 'none',
      })
      .from('.image-selector > *', {
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

  function updateUserAppMetadata () {
    /*
    * This is adding information to Netlify's user.user_metadata.
    * We need to be very careful here as currently there is no way to remove this data
    * once it is stored there. At some point in the future we should store this somewhere else.
    * Right now it does not seem like a great idea as we don't want to run a Lambda function
    * every time the user changes an illustration, it would end up costing us a lot of money.
    */
    $user
      .update({
        data: {
          illustration: {
            name: $selectedIllustrationTitle,
            specialty: $selectedSpecialty,
            subSpecialty:$selectedSubSpecialty
          }
        }
      })
      .then(updatedUser => {
        $user = updatedUser
      })
      .catch(error => console.error(error));
  }
</script>

{ #if show }
  <div
    class="image-selector"
    transition:tween
  >
    <div class="left-column"></div>
    <div class="left-column">
      <PsDropdown
        options={ $specialties }
        optionKey="name"
        selected={ $selectedSpecialty }
        on:change={ selectSpecialty }
      >
        Specialty
      </PsDropdown>
    </div>

    <div class="left-column">
      <PsDropdown
        options={ $subSpecialties }
        optionKey="name"
        selected={ $selectedSubSpecialty }
        on:change={ selectSubSpecialty }
      >
        Sub-specialty
      </PsDropdown>
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
  .image-selector {
    align-content: start;
    background-color: white;
    border-color: transparent;
    border-width: 8rem 1rem 0 1rem;
    border-style: solid;
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
    grid-template-rows: min-content;
    justify-content: center;
    overflow: hidden;
    position: absolute;
    pointer-events: auto;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .image-search {
    align-self: end;
    margin: 0;
  }

  @media screen and (min-width: 900px) {
    .image-selector {
      border-width: 5rem 1rem 0 1rem;
      grid-template-columns: minmax(10ch, 40ch) minmax(10rem, 65rem);
    }

    .left-column {
      grid-column-start: 1;
    }
    .image-search {
    grid-column-start: 2;
    grid-row-start: 1;
    }
  }
</style>