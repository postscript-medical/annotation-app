<script>
  import { createEventDispatcher } from 'svelte';
  import checkPasswordRequirements from '../methods/check-password-requirements.js';
  import CredentialsTerms from './CredentialsTerms.svelte';
  import ErrorMessage from './ErrorMessage.svelte';
  import PsButton from './PsButton.svelte';

  const dispatch = createEventDispatcher();

  export let errorMessage;
  export let onDark = false;
  export let showStayLogged = false;
  export let showPasswordRequirements = false;
  export let showTerms = false;

  let email;
  let password;
  let stayLogged = false;

  function submitForm () {
    if (showPasswordRequirements) {
      const isPasswordGood = checkPasswordRequirements(password.value);
  
      if (!isPasswordGood) {
        dispatch('error', 'Password does not meet criteria');

        return;
      }
    };

    dispatch(
      'submit',
      {
        email: email.value,
        password: password.value,
        stayLogged
      }
    );
  }
</script>

<div
  class:on-dark={ onDark }
>
  <div
    class="cta"
  >
    <slot
      name="cta"
    >
      <h2>
        Get started today
      </h2>
    </slot>
  </div>
  <article>
    <header>
      <slot>
        <h2>
          Sign up
        </h2>
      </slot>
    </header>
    <ErrorMessage
      message={ errorMessage }
    />
    <form
      on:submit|preventDefault={ submitForm }
    >
      <label>
        <span>
          Email
        </span>
        <input
          bind:this={ email }
          type="email"
          required
        />
      </label>
      <label>
        <span>
          Password
        </span>
        <input
          bind:this={ password }
          type="password"
          required
        />
        { #if showPasswordRequirements }
          <span
            class="password-requirements"
          >
            8 characters or more.
            <br/>
            Including at least one number and one special character.
          </span>
        { /if }
      </label>
      { #if showStayLogged }
        <label
          class="stay-logged"
        >
          <input
            type="checkbox"
          />
          &nbsp;
          <span>
            Stay logged in
          </span>
        </label>
      { /if }
      <slot name="footer">
        <PsButton
          type="submit"
        >
            Sign up
        </PsButton>
      </slot>
    </form>
    { #if showTerms }
      <CredentialsTerms
       { onDark }
      />
    { /if }
  </article>
</div>

<style>
  form:not(:last-child) {
    margin-bottom: 2rem;
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

  .on-dark {
    color: white;
  }

  .password-requirements {
    color: #a1a1a1;
    font-size: 0.75rem;
  }

  .stay-logged {
    align-items: baseline;
    flex-direction: row;
  }
</style>