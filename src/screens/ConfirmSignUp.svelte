<script>
  import "whatwg-fetch";
  import { onMount } from "svelte";
  import { querystring } from "svelte-spa-router";
  import { session, user } from "../stores";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import SignUpPlans from "../components/SignUpPlans.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";

  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");

  let errorMessage;

  async function confirmUserSignUp() {
    if (token) {
      let response;

      /**
       * NOTE: Confirm sign up is always called from the main deployed
       * site.
       */
      try {
        response = await $session.confirm(token, true).catch((err) => {
          /* .catch() does not seem to work on IE11 */
          errorMessage = err.json.msg;
        });
      } catch {
        errorMessage = "There was an unknown error";
      }

      if (!response) return;

      $user = response;
    } else {
      errorMessage = "Token not found.";
    }
  }

  onMount(() => {
    confirmUserSignUp();
  });
</script>

<PsHeader />

<main class="central-align main-content">
  <h1>Confirm email address</h1>

  <ErrorMessage message={errorMessage} />

  {#if $user}
    <p>Thank you, your email is confirmed.</p>

    <SignUpPlans email={$user.email} />
  {:else if errorMessage}
    <p>
      Please <PsLink
        href="mailto:accounts@postscriptmedical.com"
        style="on-dark">get in touch</PsLink
      >.
    </p>
  {:else}
    <p>Please wait, we are confirming your email.</p>
  {/if}
</main>

<style>
  main {
    color: #fff;
    max-width: 40rem;
  }
</style>
