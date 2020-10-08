<script>
  import EmailConfirmed from '../components/EmailConfirmed.svelte';
  import LogInForm from '../components/LogInForm.svelte';
  import SignUpForm from  '../components/SignUpForm.svelte';
  import SignUpConfirmed from '../components/SignUpConfirmed.svelte';

  export let showEmailConfirmed = false;

  let userEmail;
  
  // $: showSignUpForm = !showEmailConfirmed;
  let showSignUpForm = false;

  function showThankYou ({ detail }) {
    userEmail = detail.email;
  }

  function confirmationAcknoleged () {
    showEmailConfirmed = false;
  };
</script>

<main>
  { #if showSignUpForm }
    <SignUpForm
      on:user-created={ showThankYou }
    />
  { :else }
    <div></div>
  { /if }

  <LogInForm />

  { #if userEmail }
    <SignUpConfirmed
      { userEmail }
    />
  { /if }

  { #if showEmailConfirmed }
    <EmailConfirmed
      on:confirm={ confirmationAcknoleged }
    />
  { /if }
</main>

<style>
  main {
    background: linear-gradient(
      to right,
      white,
      white 45%,
      green 45%
    );
    display: grid;
    grid-template-columns: 45fr 57.5fr;
    grid-template-rows: min-content 1fr;
    grid-gap: 0 8rem;
    padding: 10rem 8rem 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>