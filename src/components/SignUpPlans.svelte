<script>
  import { user } from "../stores";
  import SignUpPlanCard from "./SignUpPlanCard.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";

  export let theme = "";
  export let confirmationScreen = false;

  let subscriptionPlans = [];
  let errorMessage;

  fetch(".netlify/functions/get-subscription-plans")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      subscriptionPlans = data.subscriptionPlans.data;
    })
    .catch((error) => {
      console.error("::: Error getting subscription plans :::", error);
      // TODO: handle error
    });

  async function createCheckoutSession({ detail }) {
    const { priceId } = detail;
    const response = await fetch("/.netlify/functions/stripe-checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${$user.token.access_token}`,
      },
      body: JSON.stringify({
        email: $user.email,
        priceId,
        confirmationScreen,
      }),
    }).then((res) => res.json());

    /* Stripe is a Global */
    const stripe = Stripe(response.publishableKey);
    const { error } = await stripe.redirectToCheckout({
      sessionId: response.sessionId,
    });

    errorMessage = error;
  }
</script>

<ErrorMessage message={errorMessage} />

<div>
  <ul class="plain">
    {#each subscriptionPlans as plan}
      <li class="plan" data-theme={theme}>
        <SignUpPlanCard {plan} on:submit={createCheckoutSession} />
      </li>
    {/each}
  </ul>
</div>

<p>
  On choosing one of the plans above you will be redirect to Stripe, where you
  will be asked to provide your card details.
</p>

<style>
  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  ul > * {
    flex-grow: 1;
  }

  li {
    background-color: #fff;
    color: #000;
    border-radius: 0.25em;
    box-shadow: 0 0.125rem 0.25rem #a1a1a1;
    padding: 1.33rem;
    padding-bottom: 2.5rem;
    max-width: 50rem;
  }

  li[data-theme="on-dark"] {
    box-shadow: 0 0.125rem 0.25rem #205928;
  }

  li > :global(:not(:last-child)) {
    margin-bottom: 0.5rem;
  }

  p {
    margin-left: auto;
    margin-right: auto;
  }

  /* IE11 */
  ul > li {
    margin-right: 1rem;
    margin-bottom: 1rem;
  }

  /* Modern browsers */
  @supports (display: grid) {
    ul {
      gap: 1rem;
    }

    ul > li {
      margin-right: 0;
      margin-bottom: 0;
    }
  }
</style>
