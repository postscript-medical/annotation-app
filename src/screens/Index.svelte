<script>
  import { session } from "../stores";
  import ForgotPasswordModal from "../modals/ForgotPasswordModal.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import SignInForm from "../components/SignInForm.svelte";

  let emailSent = false;
  let errorMessage = "";
  let loading = false;
  let showForgotPasswordModal = false;

  function closeForgottenPasswordModal() {
    showForgotPasswordModal = false;
  }

  function openForgotPasswordModal() {
    emailSent = false;
    showForgotPasswordModal = true;
  }

  async function requestResetPassword({ detail: email }) {
    if (!$session) return;

    loading = true;

    await $session.requestPasswordRecovery(email).catch((error) => {
      errorMessage = error.json.msg;
    });

    if (!errorMessage) emailSent = true;

    loading = false;
  }
</script>

<PsHeader />

<main class="central-align main-content">
  <SignInForm on:open-forgot-password-modal={openForgotPasswordModal} />
</main>

{#if showForgotPasswordModal}
  <ForgotPasswordModal
    {errorMessage}
    {emailSent}
    {loading}
    on:close={closeForgottenPasswordModal}
    on:request-reset-password={requestResetPassword}
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
