<script>
  import "whatwg-fetch";
  import { onMount } from "svelte";
  import { querystring } from "svelte-spa-router";
  import { session, user } from "../stores";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import PsHeader from "../components/PsHeader.svelte";
  import ErrorMessage from "../components/ErrorMessage.svelte";

  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");

  let accountRecovered = false;
  let errorMessage = "";
  let loading = false;
  let resetComplete = false;
  let password;

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

        accountRecovered = true;
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

        resetComplete = true;
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

  {#if accountRecovered}
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
  {:else if resetComplete}
    <p>Password reset successful.</p>

    <p>
      You are now able to <a href="#/">login</a>.
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
