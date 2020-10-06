<script>
  import LogInForm from '../components/LogInForm.svelte';
  import SignUpForm from  '../components/SignUpForm.svelte';
  import SignUpConfirmation from '../components/SignUpConfirmation.svelte';
  import PsHeader from '../components/PsHeader.svelte';

  // let showSignUpForm = true;
  let userEmail;

  function showThankYou ({ detail }) {
    userEmail = detail.email;
  }
</script>

<main>
  <PsHeader />
  <!-- { #if showSignUpForm } -->
  <SignUpForm
    on:user-created={ showThankYou }
  />
  <!-- { /if } -->

  <LogInForm />

  <SignUpConfirmation
    { userEmail }
  />
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
    padding: 4rem 8rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>