<script>
  import { session, user, isLoading } from '../stores.js';
  import loadProtectedContent from '../methods/load-protected-content.js';
  import ErrorMessage from './ErrorMessage.svelte';

  let email;
  let password;
  let stayLogged = false;
  let errorMessage;

  function loginUser () {
    if (!$session) {
      console.warn('No $session object!');
      return;
    }

    $isLoading = true;

    $session
      .login(email.value, password.value, stayLogged)
      .then(response => {
        $user = response;
        loadProtectedContent($user);
        $isLoading = false;
      })
      .catch(error => {
        errorMessage = error.json.error_description;
        $isLoading = false;
      })
  }
</script>

<article>
  <h3>
    Login
  </h3>
  <form
    name="login"
    on:submit|preventDefault={loginUser}
  >
    <label>
      Email
      <input
        type="email"
        name="email"
        bind:this={email}
        required
      />
    </label>
    <label>
      Password
      <input
        type="password"
        name="password"
        bind:this={password}
        required
      />
    </label>
    <label>
      <input
        type="checkbox"
        bind:checked={stayLogged}
      />
      Stay logged in.
    </label>
    <button
      type="submit"
    >
      Log in
    </button>
  </form>
  { #if errorMessage }
    <ErrorMessage>
      { errorMessage }
    </ErrorMessage>
  { /if }
</article>