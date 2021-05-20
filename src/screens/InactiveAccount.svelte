<script>
  import ManageSubscription from "../components/ManageSubscription.svelte";
</script>

<main class="central-align main-content">
  <h2>Inactive account</h2>

  <p>You account is currently inactive.</p>

  <p>
    This could be because you have just signed up to PostScript Medical and
    haven't chosen your subscription level or because you have cancelled your
    subscription.
  </p>

  <p>
    In order to activate your account, you need to choose a plan and enter your
    payment details.
  </p>

  <ManageSubscription />
</main>

<style>
  main {
    background: rgb(250, 250, 250);
    min-height: 100vh;
  }

  main > * {
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
  }

  main > :global(:not(:last-child)) {
    margin-bottom: 2rem;
  }

  main > :global(a) {
    margin: 0 auto;
    width: 30rem;
    display: block;
  }

  @media screen and (min-width: 600px) {
    main {
      padding-top: 2rem;
    }
  }
</style>
