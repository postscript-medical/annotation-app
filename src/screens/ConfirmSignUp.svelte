<script>
  import "whatwg-fetch";
  import { onMount } from "svelte";
  import { querystring } from "svelte-spa-router";
  import { session } from "../stores";
  import subscriptionPlans from "../constants/subscription-plans";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";

  // TODO: We need to make sure all third party scripts are loaded before runing our code. There seems to be a condition where confirmation fails if that does not happen.

  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");
  const duration = 0.15;

  let email;
  let errorMessage;
  let userConfirmed = false;

  async function confirm_user_sign_up(token) {
    if (token) {
      let response = "";

      try {
        response = await $session.confirm(token).catch((err) => {
          // .catch() does not work on IE11
          errorMessage = err.json.msg;
        });
      } catch {
        errorMessage = "There was an unknown error";
      }

      if (!response) return;

      email = response.email;
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
        email,
        fromConfirmationPage: true,
      }),
    }).then(function (result) {
      return result.json();
    });
  }

  function initialise_checkout(priceId) {
    if (!priceId) {
      console.error("no priceId");
      return;
    }

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

  function tween_in(element) {
    const tl = gsap.from(element, {
      autoAlpha: 0,
      delay: duration * 0.75,
      duration,
      ease: "none",
    });

    return {
      /* GSAP's duration is in seconds. Svelte's is in miliseconds */
      duration: tl.totalDuration() * 1000,
      tick: (t) => {
        tl.progress(t);
      },
    };
  }

  function tween_out(element) {
    const tl = gsap.timeline();

    tl.set(element, {
      position: "absolute",
    }).to(element, {
      autoAlpha: 0,
      duration,
      ease: "none",
    });

    return {
      /* GSAP's duration is in seconds. Svelte's is in miliseconds */
      duration: tl.totalDuration() * 1000,
      tick: (_, u) => {
        tl.progress(u);
      },
    };
  }

  onMount(() => {
    confirm_user_sign_up(token);
  });
</script>

<PsHeader />

{#if userConfirmed}
  <main class="central-align main-content" in:tween_in out:tween_out>
    <h1>Sign up as</h1>

    <ul role="list">
      {#each subscriptionPlans as plan}
        <li>
          <p class="plan-name">{plan.name}</p>
          <p class="price">£{plan.price}</p>
          <p class="billing-frequency">Per {plan.frequency}</p>
          <button on:click={() => initialise_checkout(plan.priceId)}>
            Choose
          </button>
        </li>
      {/each}
    </ul>

    <p>
      On choosing one of the plans above you will be redirect to Stripe, where
      you be asked to provide your card details.
    </p>
  </main>
{:else if errorMessage}
  <main class="central-align main-content" in:tween_in out:tween_out>
    <h1>Something went wrong</h1>

    <p>
      <strong>{errorMessage}</strong>. Please

      <PsLink href="mailto:accounts@postscriptmedical.com" style="on-dark">
        get in touch
      </PsLink>.
    </p>
  </main>
{:else}
  <main class="central-align main-content" in:tween_in out:tween_out>
    <h1>Please wait</h1>

    <p>We are confiming your details.</p>
  </main>
{/if}

<style>
  /* Base styling */
  main {
    padding-top: 1rem;
    color: #fff;
    text-align: center;
  }

  main > :not(:last-child) {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 3.15rem;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  li {
    background-color: #fff;
    color: #000;
    border-radius: 0.25em;
    box-shadow: 0 0.125rem 0.25rem #205928;
    padding: 0.75rem 1.33rem;
    width: 200px;
  }

  li > :not(:last-child) {
    margin-bottom: 0.5rem;
  }

  button {
    background-color: #379a46;
    border: none;
    border-radius: 2em;
    box-shadow: 0 0.125rem 0.25rem #a1a1a1;
    color: #fff;
  }

  p {
    margin-left: auto;
    margin-right: auto;
  }

  .plan-name {
    font-size: 1.33rem;
    font-weight: 700;
  }

  .price {
    font-size: 2.36rem;
    font-weight: 600;
    line-height: 1;
  }

  .billing-frequency {
    text-transform: uppercase;
    color: #a1a1a1;
    font-size: 0.9em;
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
