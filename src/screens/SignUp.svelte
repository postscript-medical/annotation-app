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

  onMount(() => {
    $isLoading = false;
  });
</script>

<main class="central-align main-content">
  <header>
    <h2>Sign up</h2>
  </header>

  {#if created}
    <p>
      Your account has been created. Please check your email for the
      confirmation link.
    </p>

    <p>
      Once your accounts is confirmed, you will be able to log in and choose
      your subscription level.
    </p>
  {:else}
    <!-- <form action=""> -->
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

  @media screen and (min-width: 600px) {
    main {
      padding-top: 2rem;
    }
  }
</style>
