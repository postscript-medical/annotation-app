<script>
  import { createEventDispatcher } from 'svelte';
  import EmailConfirmedModal from '../modals/EmailConfirmedModal.svelte';
  import ForgotPasswordModal from '../modals/ForgotPasswordModal.svelte';
  import SignInForm from '../components/SignInForm.svelte';
  import SignUpForm from  '../components/SignUpForm.svelte';
  import SignUpConfirmed from '../components/SignUpConfirmed.svelte';

  export let showEmailConfirmed = false;

  const dispatch = createEventDispatcher();

  let userEmail;
  let showForgotPasswordModal = true;

  $: showSignUpForm = !showEmailConfirmed;

  function confirmationAcknoleged () {
    dispatch('email-confirmed');
  };

  function closeForgottenPasswordModal () {
    showForgotPasswordModal = false;
  };

  function openForgotPasswordModal () {
    showForgotPasswordModal = true;
  }

  function showThankYou ({ detail }) {
    userEmail = detail.email;
  }
</script>

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
    on:close={ closeForgottenPasswordModal }
  />
{ /if }