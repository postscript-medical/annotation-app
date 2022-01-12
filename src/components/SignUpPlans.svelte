<script>
  import { user, organization } from "../stores";
  import SignUpPlanCard from "./SignUpPlanCard.svelte";

  export let email;
  export let theme = "";

  let specialties = [];
  let showYearlyPlans = false;
  let subscriptionPlans = [];

  fetch(".netlify/functions/get-subscription-plans", {})
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      subscriptionPlans = data.subscriptionPlans.data;
      specialties = data.specialties.data;
    })
    .catch((error) => {
      console.error("::: Error getting subscription plans :::", error);
      // TODO: handle error
    });

  async function initialiseCustomerPortal({ detail }) {
    const { priceId, specialties } = detail;

    if (!priceId || !specialties) {
      console.error("no priceId or no specialties provided");

      return;
    }

    const response = await fetch("/.netlify/functions/stripe-customer-portal", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${$user.token.access_token}`,
      },
      body: JSON.stringify({
        stripeId: $organization.stripeID,
        email,
        priceId,
        specialties,
        updateDb: true,
      }),
    });
    const payload = await response.json();

    window.location.href = payload.url;
  }

  function togglePlanLength() {
    showYearlyPlans = !showYearlyPlans;
  }
</script>

<button type="button" on:click={togglePlanLength} data-theme={theme}>
  {showYearlyPlans ? "View monthly plans" : "View anual plans"}
</button>

<ul class="plain">
  {#each subscriptionPlans as plan}
    <li data-theme={theme}>
      <SignUpPlanCard
        {plan}
        {showYearlyPlans}
        {specialties}
        on:submit={initialiseCustomerPortal}
      />
    </li>
  {/each}
</ul>

<p>
  On choosing one of the plans above you will be redirect to Stripe, where you
  be asked to provide your card details.
</p>

<style>
  button[type="button"] {
    align-self: center;
    background-color: #fff;
    border: none;
    border-radius: 2em;
    color: #000;
    box-shadow: 0 0.125rem 0.25rem #a1a1a1;
  }

  button[data-theme="on-dark"] {
    box-shadow: 0 0.125rem 0.25rem #205928;
  }

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
    padding: 0.75rem 1.33rem;
    max-width: 20rem;
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
