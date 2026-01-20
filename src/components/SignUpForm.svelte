<script>
  import { createEventDispatcher } from "svelte";
  import { isLoading, session } from "../stores.js";
  import CredentialsForm from "./CredentialsForm.svelte";

  const dispatch = createEventDispatcher();

  let errorMessage;

  async function submit({ detail }) {
    const { email, password } = detail;

    errorMessage = null;
    isLoading.set(true);

    try {
      // Use Supabase backend function for signup
      const response = await fetch("/.netlify/functions/auth/supabase-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch("user-created", { email: data.user?.email || email });
      } else {
        errorMessage = data.error || data.message || "Failed to create account";
      }
    } catch (error) {
      console.error("Signup error:", error);
      errorMessage = "Failed to create account. Please try again.";
    } finally {
      isLoading.set(false);
    }
  }
</script>

<CredentialsForm
  {errorMessage}
  style="on-dark"
  on:submit={submit}
  on:error={({ detail }) => (errorMessage = detail)}
/>
