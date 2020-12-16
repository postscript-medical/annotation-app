<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import ErrorMessage from "../components/ErrorMessage.svelte";

  export let loading = false;
  export let errorMessage = "";

  const dispatch = createEventDispatcher();

  let resetComplete = false;
  let password;
  let submitAttempted = false;

  $: lockInput = !errorMessage && submitAttempted;

  function clearErrors() {
    submitAttempted = false;
    dispatch("clear-errors");
  }

  function submitForm() {
    submitAttempted = true;
    dispatch("reset-password", password.value);
  }

  function tweenOutComplete() {
    submitAttempted = false;
    resetComplete = true;
  }
</script>

<Modal
  cancelBtCopy="Close"
  confirmBtCopy="Reset password"
  hideCloseButton
  hideCancelButton={!resetComplete}
  hideConfirmButton={resetComplete}
  {loading}
  on:close
  on:confirm={submitForm}
  on:tween-out-complete={tweenOutComplete}>
  <span slot="header">
    {#if resetComplete}Reset complete{:else}Reset your password{/if}
  </span>

  <ErrorMessage message={errorMessage} />

  {#if resetComplete}
    <p>Your password has been successfully reset.</p>
  {:else}
    <div>
      <label>
        <span> New password </span>
        <input
          bind:this={password}
          disabled={lockInput}
          required
          type="password"
          on:input={clearErrors} />
        <span class="password-requirements">
          8 characters or more.
          <br />
          Including at least one number and one special character.
        </span>
      </label>
    </div>
  {/if}
</Modal>

<style>
  label {
    display: flex;
    flex-direction: column;
  }

  label > :global(span) {
    line-height: 1rem;
    font-size: 0.875rem;
  }

  label > :global(*:not(:last-child)) {
    margin-bottom: 0.5rem;
  }

  .password-requirements {
    color: #a1a1a1;
    font-size: 0.75rem;
  }
</style>
