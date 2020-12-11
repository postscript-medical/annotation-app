<script>
  import { createEventDispatcher } from 'svelte';
  import checkPasswordRequirements from '../methods/check-password-requirements.js';
  import CredentialsTerms from './CredentialsTerms.svelte';
  import ErrorMessage from './ErrorMessage.svelte';
  import PsButton from './PsButton.svelte';

  const dispatch = createEventDispatcher();

  export let confirmButtonCopy = 'Sign up';
  export let errorMessage = '';
  export let hidePasswordRequirements = false;
  export let hideTerms = false;
  export let showStayLogged = false;
  export let style = ''; /* options: 'on-dark' */

  let email;
  let password;
  let stayLogged = false;

  function submitForm () {
    if (!hidePasswordRequirements) {
      const isPasswordGood = checkPasswordRequirements(password.value);
  
      if (!isPasswordGood) {
        dispatch('error', { message: 'Password does not meet criteria' });

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

<article
  class={ style }
>
  <header>
    <h2>
      <slot>
        Sign up
      </slot>
    </h2>
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
      { #if !hidePasswordRequirements }
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
    <div class="form-footer">
      <PsButton
        type="submit"
        { style }
      >
          { confirmButtonCopy }
      </PsButton>
      <slot name="footer">
      </slot>
    </div>
  </form>
  { #if !hideTerms }
    <CredentialsTerms
      { style }
    />
  { /if }
</article>

<style>
  article > :global(:not(:last-child)) {
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

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .form-footer > :global(:first-child) {
    margin-right: 1rem;
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