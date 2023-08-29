<script>
  import "whatwg-fetch";
  import { push, querystring } from "svelte-spa-router";
  import { session, user } from "../stores";
  import checkPasswordRequirements from "../methods/check-password-requirements";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

  /* TODO: See if this can be passed down as props */
  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");

  let password = "";
  let passwordConfirmation = "";
  let errorMessage = "";
  let loading = false;

  async function submitForm() {
    loading = false;
    errorMessage = "";

    if (!token) {
      errorMessage = "No token found. Contact support.";

      return;
    }

    if (!checkPasswordRequirements(password)) {
      errorMessage = "Password does not meet criteria";

      return;
    }

    if (password !== passwordConfirmation) {
      errorMessage = "Passwords do not match.";

      return;
    }

    loading = true;

    $session
      .acceptInvite(token, password, true)
      .then((response) => {
        $user = response;

        push("/annotate");
      })
      .catch((error) => {
        console.log("Failed to login", error);

        errorMessage = error;
      })
      .finally(() => {
        loading = false;
      });
  }
</script>

<PsHeader />

<main class="central-align main-content">
  <h2>Welcome to PostScript</h2>

  <ErrorMessage message={errorMessage} />

  <form on:submit|preventDefault={submitForm}>
    <p>
      Please choose a password you would like to associate with your account.
    </p>

    <div class="stacker--small">
      <PsTextInput
        required
        style="vertical"
        type="password"
        value={password}
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

    <PsTextInput
      required
      style="vertical"
      type="password"
      value={passwordConfirmation}
      on:input={({ detail: value }) => (passwordConfirmation = value)}
    >
      Confirm password
    </PsTextInput>

    <p>
      By subscribing, you agree to our
      <PsLink
        style="on-dark"
        href="https://www.postscriptmedical.com/terms-of-use"
        >terms of use</PsLink
      >
      and
      <PsLink
        style="on-dark"
        href="https://www.postscriptmedical.com/privacy-policy"
        >privacy policy.</PsLink
      >
    </p>

    <PsButton type="submit" style="on-dark" {loading}>
      Accept intivation
    </PsButton>

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
  </form>
</main>

<style>
  /* Base styling */
  main {
    color: #fff;
    max-width: 30rem;
  }
</style>
