<script>
  import { isLoading, session } from "../stores.js";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

  import { privacy_policy, terms_and_conditions } from "../constants/urls.js";

  let created = false;
  let email;
  let errorMessage;
  let password;
  let password_confirmation;

  function create_account() {
    errorMessage = null;

    if (!checkPasswordRequirements(password)) {
      errorMessage = "Password does not meet criteria";

      return;
    }

    if (!$session) {
      console.error("No $session object!");
      errorMessage =
        "Something went wrong. Try reloading the page. Or if the problem persists, get in touch.";

      return;
    }

    $isLoading = true;

    if (password !== password_confirmation) {
      errorMessage = "Password do not match. Try again.";

      $isLoading = false;

      return;
    }

    $session
      .signup(email, password)
      .then(() => {
        created = true;
      })
      .catch((error) => {
        errorMessage = error.json.msg;
      })
      .finally(() => {
        $isLoading = false;
      });
  }
</script>

<PsHeader />

<main class="central-align main-content">
  <header>
    <h2>Sign up</h2>
  </header>

  {#if created}
    <p>Your account has been created.</p>

    <p>
      Please check your email for the the confirmation link (including your Junk
      folder).
    </p>

    <p>Once your account is confirmed, you will be able to select your plan.</p>
  {:else}
    <ErrorMessage message={errorMessage} />

    <form on:submit|preventDefault={create_account}>
      <PsTextInput
        required
        style="vertical"
        value={email}
        on:input={({ detail: value }) => (email = value)}
      >
        Email address
      </PsTextInput>

      <div class="stacker--small">
        <PsTextInput
          required
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

      <PsTextInput
        required
        style="vertical"
        value={password_confirmation}
        type="password"
        on:input={({ detail: value }) => (password_confirmation = value)}
      >
        Confirm password
      </PsTextInput>

      <p>
        By subscribing, you agree to our
        <PsLink style="on-dark" href={terms_and_conditions}>terms of use</PsLink
        >
        and
        <PsLink style="on-dark" href={privacy_policy}>privacy policy</PsLink>.
      </p>

      <PsButton type="submit" style="on-dark">Create account</PsButton>
    </form>

    <p>
      Already have an account?
      <PsLink href="/" style="on-dark">Sign in</PsLink>.
    </p>

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
  main {
    max-width: 30rem;
    color: #fff;
  }
</style>
