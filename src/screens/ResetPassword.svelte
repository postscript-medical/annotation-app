<script>
  import "whatwg-fetch";
  import { onMount } from "svelte";
  import { querystring } from "svelte-spa-router";
  import { session, user } from "../stores";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";

  const ACCOUNT_RECOVERED = "account-recovered";
  const RESET_COMPLETE = "reset-complete";
  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");

  let errorMessage = "";
  let loading = false;
  let password;
  let state = "unverified";

  $: lockInput = !errorMessage && loading;

  function clearErrors() {
    errorMessage = "";
  }

  async function recoverUserAccount() {
    if (token) {
      const response = await $session.recover(token, true).catch((err) => {
        errorMessage = err.json.msg;
      });

      if (response) {
        $user = response;

        state = ACCOUNT_RECOVERED;
      }
    } else {
      errorMessage = "Token not found.";
    }
  }

  async function resetUserPassword() {
    const isPasswordGood = checkPasswordRequirements(password);

    clearErrors();

    if (!isPasswordGood) {
      errorMessage = "Password does not meet criteria.";

      return;
    }

    if (!$user) {
      errorMessage = "Invalid user. Please contact support.";

      return;
    }

    loading = true;

    $user
      .update({ password })
      .then((updatedUser) => {
        $user = updatedUser;

        state = RESET_COMPLETE;
      })
      .catch((err) => {
        errorMessage = `Failed to update user: ${err.message}`;
      })
      .finally(() => {
        loading = false;
      });
  }

  onMount(() => {
    recoverUserAccount();
  });
</script>

<PsHeader />

<main class="central-align main-content">
  <h1>Reset your password</h1>

  <ErrorMessage message={errorMessage} />

  {#if state === ACCOUNT_RECOVERED}
    <p>Validation successfull.</p>

    <form on:submit|preventDefault={resetUserPassword}>
      <label>
        <span> New password </span>
        <input
          bind:value={password}
          disabled={lockInput}
          required
          type="password"
          on:input={clearErrors}
        />
        <span class="password-requirements">
          8 characters or more.
          <br />
          Including at least one number and one special character.
        </span>
      </label>

      <button type="submit" disabled={lockInput}> Reset password </button>
    </form>
  {:else if state === RESET_COMPLETE}
    <p>Password reset successful.</p>

    <p>
      You are now able to <PsLink href="/#" style="on-dark">login</PsLink>.
    </p>
  {:else if !errorMessage}
    <p>Please wait, validating your reset token.</p>
  {/if}
</main>

<style>
  main {
    color: #fff;
    max-width: 40rem;
  }

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
    font-size: 0.75rem;
  }
</style>
