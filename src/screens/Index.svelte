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
    loading = true;
    errorMessage = null;

    try {
      const response = await fetch(
        "/.netlify/functions/auth-password-reset-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        errorMessage = data.error || "Error sending password reset email";
      } else {
        emailSent = true;
      }
    } catch (error) {
      errorMessage = "Error sending password reset email";
      console.error("Password reset request error:", error);
    }

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
