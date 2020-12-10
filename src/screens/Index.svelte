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

  function confirmation_acknoleged () {
    dispatch('email-confirmed');
  };

  function close_forgotten_password_modal () {
    showForgotPasswordModal = false;
  };

  function open_forgot_password_modal () {
    emailSent = false;
    showForgotPasswordModal = true;
  }

  async function request_reset_password ({ detail: email }) {
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
    <SignUpForm
      on:user-created={ showThankYou }
    />

    <SignInForm
      on:open-forgot-password-modal={ open_forgot_password_modal}
    />
  </main>

  { #if userEmail }
    <SignUpConfirmed
      { userEmail }
    />
  { /if }

  { #if showEmailConfirmed }
    <EmailConfirmedModal
      on:close={ confirmation_acknoleged }
    />
  { /if }

  { #if showForgotPasswordModal }
    <ForgotPasswordModal
      { errorMessage }
      { emailSent }
      { loading }
      on:close={ close_forgotten_password_modal }
      on:request-reset-password={ request_reset_password }
    />
  { /if }
</div>