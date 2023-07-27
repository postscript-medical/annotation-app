<script>
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import IconClose from "../components/icons/IconClose.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsTooltip from "../components/PsTooltip.svelte";

  export let cancelBtCopy = "Cancel";
  export let confirmBtCopy = "Confirm";
  export let disableConfirmButton = false;
  export let hideCancelButton = false;
  export let hideCloseButton = false;
  export let hideConfirmButton = false;
  export let loading = false;
  export let style = "normal"; /* [normal, extend] */

  const dispatch = createEventDispatcher();

  let modal;
  let position = { x: 0, y: 0 };
  let showTooltip = false;
  let wrapper;

  function confirm() {
    dispatch("confirm");
  }

  function close(isConfirm) {
    isConfirm ? dispatch("confirm") : dispatch("close");
  }

  function handleEnter() {
    const { left, top, width, height } = this.getBoundingClientRect();

    position = {
      x: left + width,
      y: top + height * 0.5,
    };

    showTooltip = true;
  }

  function handleLeave() {
    showTooltip = false;
  }
</script>

<div bind:this={wrapper} class="modal-wrapper" transition:fade>
  <article bind:this={modal} class={`modal shadow ${style}`}>
    <form on:submit|preventDefault={confirm}>
      <h2 class="modal-header">
        <slot name="header" />

        {#if !hideCloseButton}
          <button
            class="close"
            type="button"
            on:click={() => close()}
            on:pointerenter={handleEnter}
            on:pointerleave={handleLeave}
          >
            <IconClose />
          </button>

          {#if showTooltip}
            <PsTooltip x={position.x} y={position.y}>Close</PsTooltip>
          {/if}
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
          <PsButton
            disabled={disableConfirmButton}
            {loading}
            on:tween-out-complete
            type="submit"
          >
            {confirmBtCopy}
          </PsButton>
        {/if}
      </footer>
    </form>
  </article>
</div>

<style>
  /* Base styling */
  .modal-wrapper {
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
    border-radius: 1rem;
    padding: 2rem;
    max-height: 90%;
    width: 95%;
  }

  .close {
    border: 0;
    background: transparent;
    padding: 0;
  }

  /* Temp hack to negate the global style */
  form > :global(:not(:last-child)) {
    margin: 0;
  }

  .extend {
    height: 90%;
  }

  @media screen and (min-width: 600px) {
    .modal {
      min-width: 30rem;
    }

    .normal {
      max-width: 50ch;
    }

    .extend {
      width: 90%;
      max-width: 1920px;
    }
  }

  /* IE11 */
  .modal {
    overflow: auto;
  }
  .modal-header {
    align-items: flex-start;
    display: flex;
  }

  .modal-header > :global(:not(:last-child)) {
    margin-right: 1rem;
  }

  .modal-header .close {
    margin-left: auto;
  }

  form > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }

  /* Modern browsers */
  @supports (display: grid) {
    .modal {
      align-content: start;
      display: grid;
      gap: 2rem 1rem;
      grid-template-columns: 1rem repeat(6, 1fr) 1rem;
      grid-template-rows: 1fr;
      overflow: hidden;
    }

    .modal-header {
      align-items: start;
      display: grid;
      gap: 0.5rem;
      grid-template-columns: 1fr min-content;
    }

    .modal-header > :global(:not(:last-child)) {
      margin-right: 0;
    }

    form {
      display: grid;
      gap: 1rem;
      grid-column: 1 / -1;
      grid-template-rows: min-content 1fr min-content;
      height: 100%;
      overflow: hidden;
    }

    form > :global(:not(:last-child)) {
      margin-bottom: 0;
    }
  }

  @media print {
    .modal-wrapper {
      display: none;
    }
  }
</style>
