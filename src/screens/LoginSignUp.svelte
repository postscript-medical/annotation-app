<script>
  import LogInForm from '../components/LogInForm.svelte';
  import SignUpForm from  '../components/SignUpForm.svelte';

  // let showSignUpForm = true;

</script>

<main>
  <header>
  <img src="" alt="PostScript Medical logo" />
  </header>
    <!-- { #if showSignUpForm } -->
  <SignUpForm />
    <!-- { /if } -->

  <LogInForm />
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
    grid-gap: 4rem 8rem;
    padding: 4rem 8rem;
    overflow-y: auto;
    overflow-x: hidden;
  }

  header {
    grid-column: 1 / -1;
  }
</style>