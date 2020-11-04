<script>
  import { user } from '../stores.js';
  import ManageSubscription from '../components/ManageSubscription.svelte';
</script>

<div class="ps-app">
  <main
    class="main-grid main-content central-align"
  >
    { #if user }
      <article>
        <h2>
          Thank you for signing up to PostScript Digital
        </h2>
        <p>
          In order to access the services provided by us, you will have to setup a subscription.
        </p>
        <p>
          To do so, click <ManageSubscription> on this link to manage your subscription</ManageSubscription>.
        </p>
      </article>
    { /if }
  </main>
</div>

<style>
    main {
      height: 100%;
      background-color: white;
    }

  @media screen and (min-width: 600px) {
    main {
      height: auto;
      background-color: transparent;
    }
  }
</style>