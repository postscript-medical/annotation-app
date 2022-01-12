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
    if (!$session) {
      console.warn("No $session object!");
      return;
    }

    const { email, password, stayLogged } = detail;

    errorMessage = null;

    isLoading.set(true);

    const response = await $session
      .login(email, password, stayLogged)
      .catch((error) => {
        errorMessage = "Error validating your credentials";

        console.error("SignInForm:", error);

        isLoading.set(false);
      });

    if (!response) return;

    if (!stayLogged) {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ email, password })
      );
    }

    $user = response;

    push("/annotate");
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
