<script>
  import { createEventDispatcher } from "svelte";
  import { push } from "svelte-spa-router";
  import { isLoading, session, user } from "../stores.js";
  import { STORAGE_KEY } from "../constants/session.js";
  import CredentialsForm from "./CredentialsForm.svelte";
  import PsButton from "./PsButton.svelte";

  const dispatch = createEventDispatcher();

  let errorMessage;

  function openForgotPasswordModal() {
    dispatch("open-forgot-password-modal");
  }

  async function submit({ detail }) {
    const { email, password, stayLogged } = detail;

    errorMessage = null;
    isLoading.set(true);

    try {
      const response = await fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage = data.error || "Error validating your credentials";
        isLoading.set(false);
        return;
      }

      // Store the session in localStorage
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Update stores
      $user = data.user;
      $session = data;

      push("/annotate");
    } catch (error) {
      errorMessage = "Error validating your credentials";
      console.error("SignInForm:", error);
      isLoading.set(false);
    }
  }
</script>

<CredentialsForm
  confirmButtonCopy="Login"
  {errorMessage}
  hidePasswordRequirements
  showStayLogged
  style="on-dark"
  on:submit={submit}
>
  <span> Sign in </span>
  <div slot="footer" class="footer">
    <PsButton style="on-dark inline" on:click={openForgotPasswordModal}>
      Forgot your password?
    </PsButton>
  </div>
</CredentialsForm>

<style>
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer > :global(:first-child) {
    margin-right: 1rem;
  }
</style>
