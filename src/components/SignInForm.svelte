<script>
  import {
    session,
    user,
    isLoading
  } from '../stores.js';
  import { STORAGE_KEY } from '../constants/session.js'
  import loadProtectedContent from '../methods/load-protected-content.js';
  import CredentialsForm from './CredentialsForm.svelte';
  import PsButton from './PsButton.svelte';
  import PsLink from './PsLink.svelte';

  let errorMessage;

  function submit ({ detail }) {
    if (!$session) {
      console.warn('No $session object!');
      return;
    }

    const { email, password, stayLogged } = detail;

    errorMessage = undefined;
    $isLoading = true;

    $session
      .login(email, password, stayLogged)
      .then(response => {
        $user = response;
        loadProtectedContent($user);
        $isLoading = false;

        if (!stayLogged) {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
        }
      })
      .catch(error => {
        errorMessage = error.json.error_description;
        $isLoading = false;
      })
  }
</script>

<CredentialsForm
  { errorMessage }
  onDark
  on:submit={ submit }
  rememberMe
>
  <h2
    slot="cta"
  >
    Already have an account?
  </h2>
  <h2>
    Sign in
  </h2>
  <div
    slot="footer"
    class="footer"
  >
    <PsButton
      onDark
    >
      Login
    </PsButton>
    <PsLink
      href="toReplaceLater"
      onDark
    >
      Forgot your password?
    </PsLink>
  </div>
</CredentialsForm>

<style>
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer > :global(:first-child) {
    margin-right: 1rem;
  }
</style>