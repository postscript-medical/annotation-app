<script>
  import { createEventDispatcher } from 'svelte';
  import ErrorMessage from './ErrorMessage.svelte';
  import PsButton from './PsButton.svelte';

  const dispatch = createEventDispatcher();

  export let onDark = false;
  export let rememberMe = false;

  let email;
  let errorMessage; // receives error as a prop
  let password;
  let stayLogged = false;

  function submitForm () {
    dispatch(
      'submit',
      {
        email,
        password,
        stayLogged
      }
    );
  }
</script>

<div class={ onDark ? 'on-dark' : ''}>
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
    <form
      on:submit|preventDefault={ submitForm }
    >
      <label
        for="put_a_dynamic_value_here"
      >
        Email
      </label>
      <input
        bind:value={ email }
        id="put_a_dynamic_value_here"
        type="email"
        required
      />
      <label
        for="put_a_dynamic_value_here_2"
      >
        Password
      </label>
      <input
        bind:value={ password }
        id="put_a_dynamic_value_here_2"
        type="password"
        required
      />
      { #if rememberMe }
        <label class="remember-me">
          <input
            type="checkbox"
            bind:checked={ stayLogged }
          />
          Stay logged in
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

  label {
    margin-bottom: 0.5rem;
  }

  div.on-dark {
    color: white;
  }

  .cta {
    margin-bottom: 6rem;
  }
</style>