<script>
  import { fetch } from "whatwg-fetch";
  import { querystring } from "svelte-spa-router";

  import { isLoading, session } from "../stores.js";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import { privacy_policy, terms_and_conditions } from "../constants/urls.js";

  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsLink from "../components/PsLink.svelte";
  import PsLogo from "../components/PsLogo.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";
  import SignInForm from "../components/SignInForm.svelte";

  const searchParams = new URLSearchParams($querystring);
  const coupon = searchParams.get("coupon");
  const product = searchParams.get("product");

  let created = false;
  let email = "";
  let errorMessage = "";
  let password = "";
  let passwordConfirmation = "";

  async function createInvitedAccount() {
    errorMessage = "";

    if (!checkPasswordRequirements(password)) {
      errorMessage = "Password does not meet criteria";

      return;
    }

    // Note: $session check removed - create-invited-account function doesn't require session
    // The function handles authentication internally

    if (password !== passwordConfirmation) {
      errorMessage = "Passwords do not match. Try again.";

      return;
    }

    $isLoading = true;

    const response = await fetch("/.netlify/functions/create-invited-account", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        coupon,
        product,
      }),
    });

    if (response.ok) {
      created = true;
    } else {
      const { message } = await response.json();

      errorMessage = message;
    }

    $isLoading = false;
  }
</script>

<!-- <PsHeader /> -->
<header>
  <h1 class="options">
    <a href="/">
      <PsLogo showName style="large white" />
    </a>
  </h1>

  <img
    class="dr-falk"
    src="images/annotation-app/FALK_Logo_RGB_neg_ul0xre.png"
    alt="Dr. Falk Pharma"
    width="931"
    height="638"
  />
</header>

<main class="central-align main-content">
  <ErrorMessage message={errorMessage} />

  {#if created}
    <p>Your account has been created.</p>

    <SignInForm />
  {:else}
    <header>
      <h2>Congratulations!</h2>
    </header>

    <p>
      <PsLink href="https://drfalk.co.uk/" style="on-dark"
        >Dr Falk Pharma</PsLink
      > has gifted you with a 12-month subscription to <PsLink
        href="https://www.postscriptmedical.com/"
        style="on-dark">PostScript Medical</PsLink
      >. Enter your email address and a password of your choice to create the
      account.
    </p>

    <form on:submit|preventDefault={createInvitedAccount}>
      <!-- required -->
      <PsTextInput
        style="vertical"
        value={email}
        on:input={({ detail: value }) => (email = value)}
      >
        Email address
      </PsTextInput>

      <div class="stacker--small">
        <!-- required -->
        <PsTextInput
          style="vertical"
          value={password}
          type="password"
          on:input={({ detail: value }) => (password = value)}
        >
          Password
        </PsTextInput>

        <p class="note">
          8 characters or more.
          <br />
          Including at least one number and one special character.
        </p>
      </div>

      <!-- required -->
      <PsTextInput
        style="vertical"
        value={passwordConfirmation}
        type="password"
        on:input={({ detail: value }) => (passwordConfirmation = value)}
      >
        Confirm password
      </PsTextInput>

      <p>
        By creating an account with us you will be agreeing to our <PsLink
          style="on-dark"
          href={terms_and_conditions}>terms of use</PsLink
        > and <PsLink style="on-dark" href={privacy_policy}
          >privacy policy</PsLink
        >.
      </p>

      <PsButton type="submit" style="on-dark">Create account</PsButton>
    </form>

    <p>
      Please note we only support modern browsers such as <PsLink
        style="on-dark"
        href="https://www.microsoft.com/en-us/edge">Microsoft Edge</PsLink
      >, <PsLink
        style="on-dark"
        href="https://www.mozilla.org/en-GB/firefox/new/"
        >Mozilla Firefox</PsLink
      >, <PsLink style="on-dark" href="https://www.google.com/chrome/"
        >Google Chrome</PsLink
      >.
    </p>
  {/if}
</main>

<style>
  header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 1rem 1rem 0 1rem;
    width: 100%;
  }

  main {
    max-width: 30rem;
    color: #fff;
  }

  .dr-falk {
    height: 4rem;
    width: auto;
  }
</style>
