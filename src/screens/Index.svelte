<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { session } from "../stores";
  import EmailConfirmedModal from "../modals/EmailConfirmedModal.svelte";
  import ForgotPasswordModal from "../modals/ForgotPasswordModal.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import SignInForm from "../components/SignInForm.svelte";

  const dispatch = createEventDispatcher();

  let emailSent = false;
  let errorMessage = "";
  let loading = false;
  let showEmailConfirmed = false;
  let showForgotPasswordModal = false;

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

  function navigate_home() {
    push("/");
  }

  function open_forgot_password_modal() {
    emailSent = false;
    showForgotPasswordModal = true;
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

  onMount(() => {
    const hash = window.location.hash;

    if (hash) {
      const [hashId, token] = hash.split("=");

      switch (hashId) {
        case "#confirmation_token":
          confirm_user_sign_up(token);
          break;
      }
    }
  });
</script>

<PsHeader />

<main class="central-align main-content">
  <SignInForm on:open-forgot-password-modal={open_forgot_password_modal} />
</main>

{#if showEmailConfirmed}
  <EmailConfirmedModal on:close={navigate_home} />
{:else if showForgotPasswordModal}
  <ForgotPasswordModal
    {errorMessage}
    {emailSent}
    {loading}
    on:close={close_forgotten_password_modal}
    on:request-reset-password={request_reset_password}
  />
{/if}

<style>
  main {
    max-width: 30rem;
    padding-top: 1rem;
  }

  @media screen and (min-width: 600px) {
    main {
      padding-top: 2rem;
    }
  }
</style>
