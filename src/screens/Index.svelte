<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { session, user } from "../stores";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import EmailConfirmedModal from "../modals/EmailConfirmedModal.svelte";
  import ForgotPasswordModal from "../modals/ForgotPasswordModal.svelte";
  import ResetPasswordModal from "../modals/ResetPasswordModal.svelte";
  import SignInForm from "../components/SignInForm.svelte";

  const dispatch = createEventDispatcher();

  let emailSent = false;
  let errorMessage = "";
  let loading = false;
  let showEmailConfirmed = false;
  let showForgotPasswordModal = false;
  let showResetPasswordModal = false;

  function clear_errors() {
    errorMessage = "";
  }

  async function confirm_user_sign_up(token) {
    const response = await $session.confirm(token).catch((err) => {
      dispatch("routeEvent", { errorMessage: err.json.msg });
    });

    if (!response) return;

    showEmailConfirmed = true;
  }

  function close_forgotten_password_modal() {
    showForgotPasswordModal = false;
  }

  function close_reset_password_modal() {
    showResetPasswordModal = false;

    navigate_home();
  }

  function navigate_home() {
    push("/");
  }

  function open_forgot_password_modal() {
    emailSent = false;
    showForgotPasswordModal = true;
  }

  async function recover_user_account(token) {
    const response = await $session.recover(token, true).catch((err) => {
      dispatch("routeEvent", { errorMessage: err.json.msg });
    });

    if (response) {
      $user = response;

      showResetPasswordModal = true;
    }
  }

  async function request_reset_password({ detail: email }) {
    if (!$session) return;

    loading = true;

    // this does not seem to be generating the emails...
    await $session.requestPasswordRecovery(email).catch((error) => {
      errorMessage = error.json.msg;
    });

    if (!errorMessage) emailSent = true;

    loading = false;
  }

  async function reset_user_password({ detail: password }) {
    const is_passwordGood = checkPasswordRequirements(password);

    clear_errors();

    if (!is_passwordGood) {
      errorMessage = "Password does not meet criteria.";

      return;
    }

    if (!$user) {
      errorMessage = "Invalid user. Please contact support.";

      return;
    }

    loading = true;

    $user
      .update({ password })
      .then((updated_user) => {
        $user = updated_user;

        loading = false;
      })
      .catch((err) => {
        errorMessage = `Failed to update user: ${err.message}`;
      });
  }

  onMount(() => {
    const hash = window.location.hash;

    if (hash) {
      const [hashId, token] = hash.split("=");

      switch (hashId) {
        case "#confirmation_token":
          confirm_user_sign_up(token);
          break;

        case "#recovery_token":
          recover_user_account(token);
          break;
      }
    }
  });
</script>

<div class="ps-app">
  <main class="main-grid main-content central-align">
    <div>
      <!-- Blank on purpose -->
    </div>

    <div>
      <h2 class="on-dark">Already have an account?</h2>

      <SignInForm on:open-forgot-password-modal={open_forgot_password_modal} />
    </div>
  </main>

  {#if showEmailConfirmed}
    <EmailConfirmedModal on:close={navigate_home} />
  {:else if showResetPasswordModal}
    <ResetPasswordModal
      {errorMessage}
      {loading}
      on:clear-errors={clear_errors}
      on:close={close_reset_password_modal}
      on:reset-password={reset_user_password} />
  {:else if showForgotPasswordModal}
    <ForgotPasswordModal
      {errorMessage}
      {emailSent}
      {loading}
      on:close={close_forgotten_password_modal}
      on:request-reset-password={request_reset_password} />
  {/if}
</div>

<style>
  div > :global(:not(:last-child)) {
    margin-bottom: 2rem;
  }

  .on-dark {
    color: white;
  }
</style>
