<script>
  import { createEventDispatcher } from 'svelte';
  import { session } from '../stores';
  import EmailConfirmedModal from '../modals/EmailConfirmedModal.svelte';
  import ForgotPasswordModal from '../modals/ForgotPasswordModal.svelte';
  import SignInForm from '../components/SignInForm.svelte';
  import SignUpForm from  '../components/SignUpForm.svelte';
  import SignUpConfirmed from '../components/SignUpConfirmed.svelte';

  export let showEmailConfirmed = false;

  const dispatch = createEventDispatcher();

  let emailSent = false;
  let errorMessage = '';
  let loading = false;
  let userEmail;
  let showForgotPasswordModal = false;

  $: showSignUpForm = !showEmailConfirmed;

  function confirmationAcknoleged () {
    dispatch('email-confirmed');
  };

  function closeForgottenPasswordModal () {
    showForgotPasswordModal = false;
  };

  function openForgotPasswordModal () {
    emailSent = false;
    showForgotPasswordModal = true;
  }

  async function requestResetPassword ({ detail: email }) {
    if (!$session) {
      error = {
        json: {
          msg: 'User session not authenticated. Please log out and log back in.'
        }
      };

      return;
    };

    loading = true;

    // this does not seem to be generating the emails...
    await $session
      .requestPasswordRecovery(email)
      .catch(error => {
        console.error('Error', error)
        errorMessage = error.json.msg;
      });

      if (!errorMessage) emailSent = true;

      loading = false;
  };

  function showThankYou ({ detail }) {
    userEmail = detail.email;
  };
</script>

<div class="ps-app">
  <main
    class="main-grid main-content central-align"
  >
    { #if showSignUpForm }
      <SignUpForm
        on:user-created={ showThankYou }
      />
    { :else }
      <div></div>
    { /if }

    <SignInForm
      on:open-forgot-password-modal={ openForgotPasswordModal}
    />
  </main>

  { #if userEmail }
    <SignUpConfirmed
      { userEmail }
    />
  { /if }

  { #if showEmailConfirmed }
    <EmailConfirmedModal
      on:confirm={ confirmationAcknoleged }
    />
  { /if }

  { #if showForgotPasswordModal }
    <ForgotPasswordModal
      { errorMessage }
      { emailSent }
      { loading }
      on:close={ closeForgottenPasswordModal }
      on:request-reset-password={ requestResetPassword }
    />
  { /if }
</div>