<script>
  import { createEventDispatcher } from 'svelte';
  import EmailConfirmedModal from '../modals/EmailConfirmedModal.svelte';
  import SignInForm from '../components/SignInForm.svelte';
  import SignUpForm from  '../components/SignUpForm.svelte';
  import SignUpConfirmed from '../components/SignUpConfirmed.svelte';

  export let showEmailConfirmed = false;

  const dispatch = createEventDispatcher();

  let userEmail;

  $: showSignUpForm = !showEmailConfirmed;

  function showThankYou ({ detail }) {
    userEmail = detail.email;
  }

  function confirmationAcknoleged () {
    dispatch('email-confirmed');
  };
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

  <SignInForm />
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