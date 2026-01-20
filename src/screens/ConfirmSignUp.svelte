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
    if (!token) {
      errorMessage = "Token not found.";
      return;
    }

    try {
      // Use Supabase backend function to confirm signup
      const response = await fetch(
        "/.netlify/functions/auth/supabase-confirm-signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        $user = data.user;
      } else {
        const errorData = await response.json();
        errorMessage =
          errorData.error ||
          errorData.message ||
          "Failed to confirm email address";
      }
    } catch (err) {
      console.error("Error confirming signup:", err);
      errorMessage = "There was an unknown error. Please try again.";
    }
  }

  onMount(() => {
    confirmUserSignUp();
  });
</script>

<PsHeader />

<main class="central-align main-content">
  <h1>
    {#if $user}
      Email confirmed
    {:else}
      Confirm email address
    {/if}
  </h1>

  <ErrorMessage message={errorMessage} />

  {#if $user}
    <p>Thank you.</p>

    <p>Please choose a subscription type:</p>

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
    padding-bottom: 5rem;
  }
</style>
