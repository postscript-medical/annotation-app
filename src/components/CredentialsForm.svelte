<script>
  import { createEventDispatcher } from 'svelte';
  import ErrorMessage from './ErrorMessage.svelte';
  import PsButton from './PsButton.svelte';

  const dispatch = createEventDispatcher();

  export let errorMessage;
  export let onDark = false;
  export let rememberMe = false;

  let email;
  let password;
  let stayLogged = false;

  function submitForm () {
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
      <slot name="header">
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
      </label>
      { #if rememberMe }
        <label
          class="remember-me"
        >
          <input
            type="checkbox"
            bind:checked={ stayLogged }
          />
          <span>
            Stay logged in
          </span>
        </label>
      { /if }
      <slot name="footer">
        <PsButton>
            Sign up
        </PsButton>
      </slot>
    </form>
  </article>
</div>

<style>
  header,
  .remember-me {
    margin-bottom: 2rem;
  }

  label > span {
    margin-bottom: 0.5rem;
  }

  div.on-dark {
    color: white;
  }

  .cta {
    margin-bottom: 6rem;
  }
</style>