<script>
  import { onMount } from "svelte";
  import { isLoading } from "../stores.js";
  import PsLink from "../components/PsLink.svelte";

  const plans = [
    {
      label: "Individual plan",
      id: 1,
      price: "9.95",
      priceId: "price_1IledhApFf30oe2K3r4cavj9",
      billingCycle: "Monthly",
    },
    {
      label: "Individual plan",
      id: 2,
      price: "99.5",
      priceId: "price_1IleecApFf30oe2KlfjYOSOT",
      billingCycle: "Yearly",
    },
    {
      label: "Team plan",
      id: 3,
      price: "995",
      priceId: "price_1IlefsApFf30oe2KTztwzYjK",
      billingCycle: "Yearly",
    },
    {
      label: "Hospital plan",
      id: 4,
      price: "9,995",
      priceId: "price_1IlegbApFf30oe2Ke1TniqAU",
      billingCycle: "Yearly",
    },
  ];
  let selection = 1;

  $: selectedPlan = plans.find(({ id }) => id === selection);

  function handleResult(result) {
    console.log("result", result);
  }

  function inititate_checkout() {
    console.log("initiate checkout");
    fetch("/.netlify/functions/stripe-checkout", {
      method: "Post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId: selectedPlan.priceId,
      }),
    })
      .then(function (result) {
        return result.json();
      })
      .then(function (data) {
        console.log("before init Stripe::", data);
        const stripe = Stripe(data.publishableKey);

        stripe
          .redirectToCheckout({
            sessionId: data.sessionId,
          })
          .then(handleResult);
      });
  }

  onMount(() => {
    $isLoading = false;
  });
</script>

<main class="central-align main-content">
  <header>
    <h2>Sign up</h2>
  </header>

  <div class="plans">
    {#each plans as plan}
      <div class="plan">
        <input
          id={plan.id}
          type="radio"
          bind:group={selection}
          value={plan.id} />
        <label for={plan.id}>
          {plan.label}
          - £{plan.price}
          -
          {plan.billingCycle}
        </label>
      </div>
    {/each}
  </div>

  <p>
    By subscribing, you agree to our
    <PsLink
      style="on-dark"
      href="https://www.postscriptmedical.com/terms-of-use">
      terms of use
    </PsLink>
    and
    <PsLink
      style="on-dark"
      href="https://www.postscriptmedical.com/privacy-policy">
      privacy policy
    </PsLink>.
  </p>

  <button id="checkout" on:click={inititate_checkout}>Enter payment information</button>
</main>

<style>
  main {
    max-width: 45ch;
    padding-top: 1rem;
    color: #fff;
  }

  main > :global(:not(:last-child)) {
    margin-bottom: 2rem;
  }

  .plans > :global(:not(:last-child)) {
    margin-bottom: 1rem;
  }
  .plan {
    display: flex;
  }

  input[type="radio"] {
    position: static;
    visibility: visible;
    left: 0;
    top: 0;
  }
  @media screen and (min-width: 600px) {
    main {
      padding-top: 2rem;
    }
  }
</style>
