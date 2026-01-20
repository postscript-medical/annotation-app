<script>
  import "whatwg-fetch";
  import { onMount } from "svelte";
  import { querystring } from "svelte-spa-router";
  import { session, user } from "../stores";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";

  const ACCOUNT_RECOVERED = "account-recovered";
  const RESET_COMPLETE = "reset-complete";

  // Extract token from URL hash fragment (Supabase format) or query params (fallback)
  function extractToken() {
    // Check hash fragment first (Supabase format: #access_token=...&type=recovery)
    // Supabase may append tokens to the hash like: #/reset-password#access_token=...&type=recovery
    if (typeof window !== "undefined" && window.location) {
      const hash = window.location.hash;

      if (hash && hash.length > 1) {
        // Check if hash contains token parameters (access_token or token_hash)
        // The hash might be: #/reset-password#access_token=... or just #access_token=...
        const hashString = hash.substring(1); // Remove leading #

        // Try parsing the entire hash as URLSearchParams first
        try {
          const hashParams = new URLSearchParams(hashString);
          const accessToken = hashParams.get("access_token");
          const tokenHash = hashParams.get("token_hash");

          if (accessToken) {
            return accessToken;
          }
          if (tokenHash) {
            return tokenHash;
          }
        } catch (e) {
          console.warn(
            "[ResetPassword] Error parsing hash as URLSearchParams:",
            e
          );
          // If parsing fails, try extracting from after a second # (nested hash)
          const secondHashIndex = hashString.indexOf("#");
          if (
            secondHashIndex !== -1 &&
            secondHashIndex < hashString.length - 1
          ) {
            try {
              const tokenPart = hashString.substring(secondHashIndex + 1);
              const hashParams = new URLSearchParams(tokenPart);
              const accessToken = hashParams.get("access_token");
              const tokenHash = hashParams.get("token_hash");

              if (accessToken) return accessToken;
              if (tokenHash) return tokenHash;
            } catch (e2) {
              // Ignore parsing errors
            }
          }
        }
      }
    }

    // Fallback to query params (for backward compatibility or custom templates)
    const searchParams = new URLSearchParams($querystring);
    return searchParams.get("token") || searchParams.get("token_hash");
  }

  // Extract token reactively - will update if querystring changes
  $: token = extractToken();

  let errorMessage = "";
  let loading = false;
  let password;
  let state = "unverified";
  let accessToken = null; // Store access_token from auth-session response

  $: lockInput = !errorMessage && loading;

  function clearErrors() {
    errorMessage = "";
  }

  async function recoverUserAccount() {
    if (!token) {
      errorMessage = "Token not found.";
      return;
    }

    try {
      // Validate the token with the backend
      const response = await fetch("/.netlify/functions/auth-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const sessionData = await response.json();
        $user = sessionData.user;
        // Store the access_token for password reset (recovery token is consumed, need to use access_token)
        accessToken = sessionData.access_token;
        state = ACCOUNT_RECOVERED;
      } else {
        const data = await response.json();
        console.error("[ResetPassword] auth-session error:", data.error);
        errorMessage = data.error || "Invalid or expired reset token";
      }
    } catch (error) {
      errorMessage = "Error validating reset token";
      console.error("Token validation error:", error);
    }
  }

  async function resetUserPassword() {
    const isPasswordGood = checkPasswordRequirements(password);

    clearErrors();

    if (!isPasswordGood) {
      errorMessage = "Password does not meet criteria.";
      return;
    }

    if (!$user) {
      errorMessage = "Invalid user. Please contact support.";
      return;
    }

    loading = true;

    try {
      const response = await fetch("/.netlify/functions/auth-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: accessToken || token, // Use access_token from auth-session if available, fallback to original token
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        state = RESET_COMPLETE;
      } else {
        console.error("[ResetPassword] Password reset failed:", data.error);
        errorMessage = data.error || "Failed to update password";
      }
    } catch (error) {
      errorMessage = "Failed to update password";
      console.error("Password reset error:", error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    recoverUserAccount();
  });
</script>

<PsHeader />

<main class="central-align main-content">
  <h1>Reset your password</h1>

  <ErrorMessage message={errorMessage} />

  {#if state === ACCOUNT_RECOVERED}
    <p>Validation successfull.</p>

    <form on:submit|preventDefault={resetUserPassword}>
      <label>
        <span> New password </span>
        <input
          bind:value={password}
          disabled={lockInput}
          required
          type="password"
          on:input={clearErrors}
        />
        <span class="password-requirements">
          8 characters or more.
          <br />
          Including at least one number and one special character.
        </span>
      </label>

      <button type="submit" disabled={lockInput}> Reset password </button>
    </form>
  {:else if state === RESET_COMPLETE}
    <p>Password reset successful.</p>

    <p>
      You are now able to <PsLink href="/#" style="on-dark">login</PsLink>.
    </p>
  {:else if !errorMessage}
    <p>Please wait, validating your reset token.</p>
  {/if}
</main>

<style>
  main {
    color: #fff;
    max-width: 40rem;
  }

  label {
    display: flex;
    flex-direction: column;
  }

  label > :global(span) {
    line-height: 1rem;
    font-size: 0.875rem;
  }

  label > :global(*:not(:last-child)) {
    margin-bottom: 0.5rem;
  }

  .password-requirements {
    font-size: 0.75rem;
  }
</style>
