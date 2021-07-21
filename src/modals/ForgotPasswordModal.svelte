<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import ErrorMessage from "../components/ErrorMessage.svelte";

  export let loading = false;
  export let emailSent = false;
  export let errorMessage = "";

  const dispatch = createEventDispatcher();

  let email;
  let showThankYou = false;

  function submitForm() {
    dispatch("request-reset-password", email.value);
  }

  function tweenOutComplete() {
    showThankYou = !errorMessage;
  }
</script>

<Modal
  cancelBtCopy="Close"
  confirmBtCopy="Send link"
  hideCancelButton={!emailSent || !showThankYou}
  hideConfirmButton={emailSent && showThankYou}
  {loading}
  on:close
  on:confirm={submitForm}
  on:tween-out-complete={tweenOutComplete}>
  <span slot="header">
    {#if emailSent && showThankYou}
      Request sent successfully
    {:else}Request a recovery password email{/if}
  </span>

  <ErrorMessage message={errorMessage} />

  {#if emailSent && showThankYou}
    <p>
      Please await a few moments before checking your email for a recovery link.
    </p>
  {:else}
    <p>
      Please enter the email address you registered with and we will email you a
      link to reset your password.
    </p>
    <label>
      <span> Email </span>
      <input bind:this={email} type="email" required />
      <p class="note">
        *When submitting a request for a new password, please allow 15 minutes
        before receiving your reset password email. Submitting multiple requests
        within this time period will result in the request being regenerated and
        delay the process.
      </p>
    </label>
  {/if}
</Modal>

<style>
  label {
    display: flex;
    flex-direction: column;
  }

  label > :global(span) {
    font-size: 0.875rem;
    line-height: 1rem;
  }

  label > :global(*) {
    margin-bottom: 0.5rem;
  }

  .note {
    font-size: 0.75em;
    opacity: 0.5;
    font-style: italic;
  }
</style>
