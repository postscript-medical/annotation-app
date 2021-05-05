<script>
  import { onMount } from "svelte";
  import { isLoading, session } from "../stores.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsLink from "../components/PsLink.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

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
  let created = false;
  let email = "";
  let password = "";
  let password_confirmation = "";
  let errorMessage;
  let selection = 1;

  $: selectedPlan = plans.find(({ id }) => id === selection);

  function create_account() {
    if (!$session) {
      console.error("No $session object!");
      return;
    }

    errorMessage = null;
    isLoading.set(true);

    if (password !== password_confirmation) {
      errorMessage = "Password do not match. Try again.";
      isLoading.set(false);
      return;
    }

    $session
      .signup(email, password)
      .then((response) => {
        isLoading.set(false);
        created = true;
      })
      .catch((error) => {
        errorMessage = error.json.msg;
        isLoading.set(false);
      });
  }

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
        email,
        password,
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

  {#if created}
    <!-- <form action=""> -->
    <p>
      Your account has been created. You will receive an email with a
      confirmation link at the address you used to sign up.
    </p>

    <p>Please enter your payment information to activate your account.</p>

    <button on:click={inititate_checkout}>Enter payment information</button>
    <!-- </form> -->
  {:else}
    <!-- <form action=""> -->
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

    <ErrorMessage message={errorMessage} />

    <PsTextInput
      placeholder="name@address.domain"
      style="vertical"
      value={email}
      on:input={({ detail: value }) => (email = value)}>
      Email address
    </PsTextInput>

    <PsTextInput
      placeholder="Letters, numbers and special characters"
      style="vertical"
      value={password}
      type="password"
      on:input={({ detail: value }) => (password = value)}>
      Password
    </PsTextInput>

    <PsTextInput
      placeholder="Letters, numbers and special characters"
      style="vertical"
      value={password_confirmation}
      type="password"
      on:input={({ detail: value }) => (password_confirmation = value)}>
      Confirm password
    </PsTextInput>

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

    <button on:click={create_account}>Create account</button>
    <!-- </form> -->
  {/if}
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
