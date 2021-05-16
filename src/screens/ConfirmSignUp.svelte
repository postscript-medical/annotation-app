<script>
  import { onMount } from "svelte";
  import { location, querystring } from "svelte-spa-router";
  import { session } from "../stores";
  import PsButton from "../components/PsButton.svelte";
  import subscriptionPlans from "../constants/subscription-plans";

  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");
  // const returningFromCheckout = searchParams.get('from-checkout')

  let userConfirmed = false;

  async function confirm_user_sign_up(token) {
    if (token) {
      const response = await $session.confirm(token).catch((err) => {
        console.log("Error confirming:", err);
        // Show error message
        // dispatch("routeEvent", { errorMessage: err.json.msg });
      });

      if (!response) return;
    }

    userConfirmed = true;
  }

  function create_checkou_session(priceId) {
    return fetch(".netlify/functions/stripe-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId,
      }),
    }).then(function (result) {
      return result.json();
    });
  }

  function initialise_checkout(priceId) {
    if (!priceId) {
      console.log("no priceId");
      // TODO: show error
      return;
    }
    console.log("click");
    // Stripe is a Global object
    const stripe = Stripe(
      "pk_test_51HRFNnApFf30oe2K3dr1r6nLyYkJfisTDUzVAQ8uCh3SGIcHwY49wndXzVLpnuu5B0WX4QFW9lmFaQYUhcsKW09900IiYkkBpQ"
    );

    create_checkou_session(priceId).then(function (data) {
      // Call Stripe.js method to redirect to the new Checkout page
      stripe
        .redirectToCheckout({
          sessionId: data.sessionId,
        })
        .then(handleResult);
    });
  }

  onMount(() => {
    confirm_user_sign_up(token);
  });
</script>

<main class="central-align main-content">
  {#if userConfirmed}
    <h1>Choose your subscription level</h1>

    <ul>
      {#each subscriptionPlans as plan}
        <li>
          <PsButton on:click={() => initialise_checkout(plan.priceId)}>
            <p>{plan.name}</p>
            <p>Amount: {plan.price}</p>
            <p>Billing: {plan.frequency}</p>
          </PsButton>
        </li>
      {/each}
    </ul>
  {:else}
    <h1>User confirmation in progress...</h1>

    <p>The current page is: {$location}</p>
    <p>The querystring is: {$querystring}</p>
    <p>The token is: {token}</p>
  {/if}
</main>
