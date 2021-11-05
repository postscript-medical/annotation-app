<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsButton from "../components/PsButton.svelte";

  export let loading = false;
  export let emailSent = false;
  export let errorMessage = "";

  const dispatch = createEventDispatcher();

  let email;
  let showThankYou = false;
  let submitAttempted = false;

  $: lockInput = !errorMessage && submitAttempted;

  function clearErrors() {
    submitAttempted = false;

    dispatch("clear-errors");
  }

  function downloadImage() {
    dispatch("download-image");
  }

  function printImage() {
    dispatch("print-image");
  }

  function submitForm() {
    submitAttempted = true;

    dispatch("send-email", email.value);
  }

  function tweenOutComplete() {
    submitAttempted = false;
    showThankYou = !errorMessage;
  }
</script>

<Modal hideCancelButton hideConfirmButton on:close on:confirm={submitForm}>
  <svelte:fragment slot="header">Share the annotated image</svelte:fragment>

  <ErrorMessage message={errorMessage} />

  <div class="modal-body">
    {#if emailSent && showThankYou}
      <p>The email has been sent</p>
      <p>You can now close this window.</p>
    {:else}
      <h3>Via email</h3>
      <input
        bind:this={email}
        disabled={lockInput}
        placeholder="Email address"
        required
        type="email"
        on:input={clearErrors}
      />
      <PsButton
        {loading}
        type="submit"
        on:tween-out-complete={tweenOutComplete}
      >
        Send
      </PsButton>
    {/if}
    <hr />
    <h3>Save the image locally</h3>
    <PsButton style="secondary" on:click={downloadImage}>
      Download image
    </PsButton>
    <hr />
    <h3>Send to your printer</h3>
    <PsButton style="secondary" on:click={printImage}>Print image</PsButton>
  </div>
</Modal>

<style>
  hr {
    width: 90%;
    opacity: 20%;
  }

  .modal-body {
    display: flex;
    flex-direction: column;
  }

  .modal-body > :global(*) {
    margin-bottom: 1rem;
  }

  .modal-body :global(:not(input)) {
    align-self: flex-start;
  }
</style>
