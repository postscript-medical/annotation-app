<script>
  import {
    createEventDispatcher,
  } from 'svelte';
  import {
    isLoading,
    session,
    user,
    viewportType
  } from '../stores.js';
  import { VIEWPORT_PHONE } from '../constants/defaults.js';
  import { STORAGE_KEY } from '../constants/session.js'
  import loadProtectedContent from '../methods/load-protected-content.js';
  import CredentialsForm from './CredentialsForm.svelte';
  import PsButton from './PsButton.svelte';
  import PsLink from './PsLink.svelte';

  const dispatch = createEventDispatcher();

  let errorMessage;
  $: showTerms = $viewportType === VIEWPORT_PHONE;

  function openForgotPasswordModal() {
    dispatch('open-forgot-password-modal');
  };

  async function submit ({ detail }) {
    if (!$session) {
      console.warn('No $session object!');
      return;
    }

    const { email, password, stayLogged } = detail;

    errorMessage = null;

    $isLoading = true;

    const response = await $session
      .login(email, password, stayLogged)
      .catch(error => {
        errorMessage = error.json.error_description;

        $isLoading = false;
      });

      if (!response) return;

      if (!stayLogged) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
      }

      $user = response;

      await loadProtectedContent($user);

      $isLoading = false;
  };

</script>

<CredentialsForm
  { errorMessage }
  onDark
  showStayLogged
  { showTerms }
  on:submit={ submit }
>
  <span
    slot="cta"
  >
    Already have an account?
  </span>
  <span>
    Sign in
  </span>
  <div
    slot="footer"
    class="footer"
  >
    <PsButton
      style="on-dark"
      type="submit"
    >
      Login
    </PsButton>
    <PsButton
      style="on-dark inline"
      on:click={ openForgotPasswordModal }
    >
      Forgot your password?
    </PsButton>
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