<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import IconClose from '../components/icons/IconClose.svelte';
  import PsButton from '../components/PsButton.svelte';

  export let cancelBtCopy = 'Cancel';
  export let confirmBtCopy = 'Confirm';
  export let hideCloseButton = false;
  export let hideCancelButton = false;
  export let hideConfirmButton = false;

  let wrapper;
  let modal

  const dispatch = createEventDispatcher();

  function confirm() {
    dispatch('confirm');
  };

  // TODO: Different animation for confirm/cancel
  function close (isConfirm) {
    gsap
      .timeline({
        onComplete: () => {
          dispatch('close')
        }
      })
      .to(
        modal,
        {
          duration: 0.15,
          scale: 0.9,
          opacity: 0,
          ease: 'circ.in'
        }
      )
    .to(
      wrapper,
      {
        duration: 0.15,
        opacity: 0,
        ease: 'none',
      }
    )
  };

  onMount(() => {
    gsap
      .timeline()
      .from(wrapper, {
        duration: 0.075,
        ease: 'none',
        opacity: 0
      })
      .from(modal, {
        duration: 0.5,
        ease: 'circ.out',
        y: 50,
        opacity: 0,
      })
  });
</script>

<div
  bind:this={ wrapper }
  class="wrapper"
>
  <article
    bind:this={ modal }
    class="modal shadow"
  >
    <!-- TODO: have only the body of the modal scroll -->
    <h2>
      <slot name="header"></slot>
    </h2>
    { #if !hideCloseButton }
      <button
        class="close"
        on:click={ close }
      >
        <IconClose />
      </button>
    { /if }
    <slot></slot>
    <footer>
      <slot name="footer"></slot>
      { #if !hideCancelButton }
        <PsButton
          style="secondary"
          on:click={ close }
        >
          { cancelBtCopy }
        </PsButton>
      { /if }
      { #if !hideConfirmButton }
        <PsButton
          on:click={ confirm }
        >
          { confirmBtCopy }
        </PsButton>
      { /if }
    </footer>
  </article>
</div>

<style>
  .wrapper {
    align-items: center;
    background-color: rgba(255,255,255,0.96);
    display: flex;   
    justify-content: center;
    height: 100%;
    left: 0;
    overflow: hidden;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 10;
  }

  .modal {
    background-color: white;
    padding: 2rem;
    border-radius: 1rem;
    max-width: 95%;
    max-height: 90%;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2rem;
    align-content: start;
  }

  .modal > :global(*) {
    grid-column: 2 / -2;
  }

  .close {
    grid-column-start: -2;
    grid-row-start: 1;
    border: 0;
    background: transparent;
    padding: 0;
    align-self: baseline;
    height: 1.75rem; /* To match the h2 height */
  }

  @media screen and (min-width: 600px) {
    .modal {
      min-width: 30rem;
      min-height: 20rem;
      max-width: 80%;
    }
  }
</style>