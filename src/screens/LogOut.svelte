<script>
  import { push } from "svelte-spa-router";
  import { isLoading, user } from "../stores.js";
  import clearLocalApplicationData from "../methods/clear-local-application-data.js";

  $isLoading = true;

  $user
    .logout()
    .then(async () => {
      push("/");

      clearLocalApplicationData();
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      $isLoading = false;
    });
</script>
