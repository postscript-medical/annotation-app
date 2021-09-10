<script>
  import { View } from "svench";
  import CredentialsForm from "./CredentialsForm.svelte";
  import PsButton from "./PsButton.svelte";

  let errorMessage = "Invalid user or password.";

  function clear_errors() {
    errorMessage = "";
  }

  function handle_error({ detail: err }) {
    errorMessage = err.message;
  }

  function open_forgot_password_modal() {}

  function submit() {
    clear_errors();
  }
</script>

<View name="Default">
  <CredentialsForm on:submit={submit} on:error={handle_error} />
</View>

<View name="Default - Error">
  <CredentialsForm {errorMessage} on:submit={submit} on:error={handle_error} />
</View>

<View name="Sign in">
  <CredentialsForm
    confirmButtonCopy="Login"
    {errorMessage}
    hidePasswordRequirements
    hideTerms
    showStayLogged
    style="on-dark"
    on:submit={submit}
    on:error={handle_error}
  >
    <span> Sign in </span>

    <div slot="footer">
      <PsButton style="on-dark inline" on:click={open_forgot_password_modal}>
        Forgot your password?
      </PsButton>
    </div>
  </CredentialsForm>
</View>
