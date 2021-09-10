<script>
  import { createEventDispatcher, onMount } from "svelte";
  import IconClose from "../components/icons/IconClose.svelte";
  import PsButton from "../components/PsButton.svelte";

  export let cancelBtCopy = "Cancel";
  export let confirmBtCopy = "Confirm";
  export let hideCloseButton = false;
  export let hideCancelButton = false;
  export let hideConfirmButton = false;
  export let loading = false;

  let wrapper;
  let modal;

  const dispatch = createEventDispatcher();

  function confirm() {
    dispatch("confirm");
  }

  // TODO: Different animation for confirm/cancel
  function close(isConfirm) {
    const tl = gsap.timeline({
      onComplete: () => {
        if (isConfirm) dispatch("confirm");
        else dispatch("close");
      },
    });

    if (isConfirm) {
      tl.to(modal, {
        duration: 0.15,
        scale: 0.9,
        autoAlpha: 0,
        ease: "circ.in",
      });
    } else {
      tl.to(modal, {
        duration: 0.5,
        ease: "circ.in",
        y: 50,
        autoAlpha: 0,
      });
    }

    tl.to(wrapper, {
      duration: 0.15,
      autoAlpha: 0,
      ease: "none",
    });
  }

  onMount(() => {
    gsap
      .timeline()
      .from(wrapper, {
        duration: 0.075,
        ease: "none",
        autoAlpha: 0,
      })
      .from(modal, {
        duration: 0.5,
        ease: "circ.out",
        y: 50,
        autoAlpha: 0,
      });
  });
</script>

<div bind:this={wrapper} class="wrapper">
  <article bind:this={modal} class="modal shadow">
    <!-- TODO: Create a separate FormModal that extends Modal to contain the form element -->
    <form on:submit|preventDefault={confirm}>
      <!-- TODO: have only the body of the modal scroll -->
      <h2 class="modal-header">
        <slot name="header" />
        {#if !hideCloseButton}
          <button class="close" type="button" on:click={() => close()}>
            <IconClose />
          </button>
        {/if}
      </h2>
      <slot />
      <footer>
        <slot name="footer" />
        {#if !hideCancelButton}
          <PsButton
            disabled={loading}
            style="secondary"
            on:click={() => close()}
          >
            {cancelBtCopy}
          </PsButton>
        {/if}
        {#if !hideConfirmButton}
          <PsButton {loading} on:tween-out-complete type="submit">
            {confirmBtCopy}
          </PsButton>
        {/if}
      </footer>
    </form>
  </article>
</div>

<style>
  .wrapper {
    align-items: center;
    background-color: rgba(255, 255, 255, 0.96);
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
    grid-template-columns: 1rem repeat(6, 1fr) 1rem;
    gap: 2rem 1rem;
    align-content: start;
  }

  .modal > :global(*) {
    grid-column: 1 / -1;
  }

  .modal-header {
    display: flex;
    flex-direction: column-reverse;
  }

  .modal-header :global(:not(:last-child)) {
    margin-top: 0.5rem;
  }
  .close {
    align-self: flex-end;
    border: 0;
    background: transparent;
    padding: 0;
  }

  @media screen and (min-width: 600px) {
    .modal {
      min-width: 30rem;
      min-height: 20rem;
      max-width: 50ch;
    }
  }
</style>
