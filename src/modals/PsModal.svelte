<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import IconClose from '../components/icons/IconClose.svelte';
  import PsButton from '../components/PsButton.svelte';

  export let cancelBtCopy = 'Cancel';
  export let confirmBtCopy = 'Confirm';
  export let hideCancelButton = false;
  export let hideCloseButton = false;
  export let hideConfirmButton = false;
  export let loading = false;

  let wrapper;
  let modal

  const dispatch = createEventDispatcher();

  function confirm() {
    dispatch('confirm');
  };

  // TODO: Different animation for confirm/cancel
  function close (isConfirm) {
    const tl = gsap
      .timeline({
        onComplete: () => {
          if (isConfirm) dispatch('confirm');
          else dispatch('close');
        }
      })

      if (isConfirm) {
        tl.to(
          modal,
          {
            duration: 0.15,
            scale: 0.9,
            opacity: 0,
            ease: 'circ.in',
          }
        );

      } else {
        tl.to(
          modal,
          {
            duration: 0.5,
            ease: 'circ.in',
            y: 50,
            opacity: 0,
          }
        );
      }

      tl.to(
        wrapper,
        {
          duration: 0.15,
          opacity: 0,
          ease: 'none',
        }
      );
  };

  onMount(() => {
    gsap
      .timeline()
      .from(wrapper, {
        duration: 0.075,
        ease: 'none',
        opacity: 0,
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
  <!-- TODO: Create a separate FormModal that extends Modal to contain the form element -->
  <aside
    bind:this={ modal }
    class="modal shadow"
  >
    <header>
      <slot
        name="title"
      ></slot>
      { #if !hideCloseButton }
          <button
            class="close"
            type="button"
            on:click={ () => close() }
          >
            <IconClose />
          </button>
        { /if }
    </header>

    <div
      class="content"
    >
      <slot></slot>
    </div>

    <footer>
      <footer>
        <slot name="footer"></slot>
        { #if !hideCancelButton }
          <PsButton
            disabled={ loading }
            style="secondary"
            on:click={ () => close() }
          >
            { cancelBtCopy }
          </PsButton>
        { /if }
        { #if !hideConfirmButton }
          <PsButton
            { loading }
            on:tween-out-complete
            on:click={ confirm }
          >
            { confirmBtCopy }
          </PsButton>
        { /if }
      </footer>
    </footer>
  </aside>
</div>

<style>
  .wrapper {
    background-color: rgba(255,255,255,0.96);
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 10;
  }

  .modal {
    background-color: white;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    left: 50%;
    max-height: 90%;
    /* Max width should be a hard pixel and change based on screen size */
    /* max-width: 95%; */
    width: 95%;
    padding: 2rem;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .modal > :global(*) {
    grid-column: 1 / -1;
  }

  header {
    display: flex;
  }

  .close {
    background: transparent;
    border: 0;
    margin-left: auto;
    padding: 0;
  }

  .content {
    overflow: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .content > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }

  @media screen and (min-width: 600px) {
    .modal {
      min-width: 30rem;
      min-height: 20rem;
    }
  }
</style>