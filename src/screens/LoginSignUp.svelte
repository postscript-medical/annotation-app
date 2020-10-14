<script>
  import { createEventDispatcher } from 'svelte';
  import EmailConfirmedModal from '../modals/EmailConfirmedModal.svelte';
  import LogInForm from '../components/LogInForm.svelte';
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
  class="main-grid"
>
  { #if showSignUpForm }
    <SignUpForm
      on:user-created={ showThankYou }
    />
  { :else }
    <div></div>
  { /if }

  <LogInForm />
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