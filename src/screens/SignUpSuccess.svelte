<script>
  import SignInForm from "../components/SignInForm.svelte";
</script>

<main class="central-align main-content">
  <h1>Subscription success</h1>

  <SignInForm />
</main>

<style>
  main {
    padding-top: 1rem;
    color: #fff;
  }

  main > :not(:last-child) {
    margin-bottom: 2rem;
  }

  main > :global(article) {
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
  }

  h1 {
    font-size: 3.15rem;
    text-align: center;
  }
</style>
