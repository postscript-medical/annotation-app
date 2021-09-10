<script>
  import { createEventDispatcher } from "svelte";
  import { isLoading, session } from "../stores.js";
  import CredentialsForm from "./CredentialsForm.svelte";

  const dispatch = createEventDispatcher();

  let errorMessage;

  function submit({ detail }) {
    if (!$session) {
      console.error("No $session object!");
      return;
    }

    const { email, password } = detail;

    errorMessage = null;
    isLoading.set(true);

    $session
      .signup(email, password)
      .then((response) => {
        dispatch("user-created", { email: response.email });
        isLoading.set(false);
      })
      .catch((error) => {
        errorMessage = error.json.msg;
        isLoading.set(false);
      });
  }
</script>

<CredentialsForm
  {errorMessage}
  style="on-dark"
  on:submit={submit}
  on:error={({ detail }) => (errorMessage = detail)}
/>
