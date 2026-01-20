<script>
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { isLoading, user, session } from "../stores.js";
  import { STORAGE_KEY } from "../constants/session.js";
  import clearLocalApplicationData from "../methods/clear-local-application-data.js";

  async function logout() {
    $isLoading = true;

    try {
      // Call the Supabase logout backend function if we have a session
      if ($session && $session.access_token) {
        await fetch("/.netlify/functions/auth/auth-logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${$session.access_token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if backend call fails
    } finally {
      // Clear local data regardless of backend response
      window.localStorage.removeItem(STORAGE_KEY);
      clearLocalApplicationData();
      push("/");
      $isLoading = false;
    }
  }

  onMount(() => {
    logout();
  });
</script>
