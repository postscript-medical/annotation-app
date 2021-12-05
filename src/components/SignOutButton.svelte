<script>
  import { push } from "svelte-spa-router";
  import { isLoading, user } from "../stores.js";
  import clearLocalApplicationData from "../methods/clear-local-application-data.js";
  import PsButton from "./PsButton.svelte";

  export let inline = false;

  function logout() {
    isLoading.set(true);

    $user
      .logout()
      .then(() => {
        clearLocalApplicationData();

        push("/");

        isLoading.set(false);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
</script>

<PsButton
  style={`secondary on-dark ${inline ? "inline" : ""}`}
  on:click={logout}
>
  Log out
</PsButton>
