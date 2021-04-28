<script>
  import { onMount } from "svelte";
  import { isLoading } from "../stores.js";

  let chosenPlan = 1;
  const plans = [
    {
      label: "Individual plan",
      id: 1,
      price: "9.95",
      billingCycle: "Monthly",
    },
    {
      label: "Individual plan",
      id: 2,
      price: "99.5",
      billingCycle: "Yearly",
    },
    {
      label: "Team plan",
      id: 3,
      price: "995",
      billingCycle: "Yearly",
    },
    {
      label: "Hospital plan",
      id: 4,
      price: "9,995",
      billingCycle: "Yearly",
    },
  ];

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
        priceId: chosenPlan,
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
          bind:group={chosenPlan}
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

  <button id="checkout" on:click={inititate_checkout}>Subscribe</button>
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
