<script>
  import { createEventDispatcher } from "svelte";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";
  import CredentialsTerms from "./CredentialsTerms.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";
  import PsButton from "./PsButton.svelte";
  import PsTextInput from "./PsTextInput.svelte";

  const dispatch = createEventDispatcher();

  export let confirmButtonCopy = "Sign up";
  export let errorMessage = "";
  export let hidePasswordRequirements = false;
  export let hideTerms = false;
  export let showStayLogged = false;
  export let style = ""; /* options: 'on-dark' */

  let email;
  let password;
  let stayLogged = false;

  function submitForm() {
    if (!hidePasswordRequirements) {
      const isPasswordGood = checkPasswordRequirements(password);

      if (!isPasswordGood) {
        dispatch("error", { message: "Password does not meet criteria" });

        return;
      }
    }

    dispatch("submit", {
      email: email,
      password: password,
      stayLogged,
    });
  }
</script>

<article class={style}>
  <header>
    <h2>
      <slot>Sign up</slot>
    </h2>
  </header>
  <ErrorMessage message={errorMessage} />
  <form on:submit|preventDefault={submitForm}>
    <PsTextInput
      required
      style="vertical"
      value={email}
      on:input={({ detail: value }) => (email = value)}
    >
      Email
    </PsTextInput>

    <PsTextInput
      style="vertical"
      value={password}
      type="password"
      on:input={({ detail: value }) => (password = value)}
    >
      Password
    </PsTextInput>
    {#if showStayLogged}
      <label class="stay-logged">
        <input type="checkbox" />
        &nbsp;
        <span> Stay logged in </span>
      </label>
    {/if}
    <div class="form-footer">
      <PsButton type="submit" {style}>{confirmButtonCopy}</PsButton>
      <slot name="footer" />
    </div>
  </form>
  {#if !hideTerms}
    <CredentialsTerms {style} />
  {/if}
</article>

<style>
  article > :global(:not(:last-child)) {
    margin-bottom: 2rem;
  }

  label {
    display: flex;
    flex-direction: column;
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .form-footer > :global(:first-child) {
    margin-right: 1rem;
  }

  .on-dark {
    color: white;
  }

  .stay-logged {
    align-items: baseline;
    flex-direction: row;
  }
</style>
