<script>
  import { user } from '../stores.js';
  import ManageSubscription from '../components/ManageSubscription.svelte';
</script>

<main>
  { #if user }
    <article>
      <h2>
        Thank you for signing up to PostScript Digital
      </h2>
      <p>
        In order to access the services provided by us, you will have to setup a subscription.
      </p>
      <p>
        To do so, just click <ManageSubscription user={ $user }> on this link to manage your subscription</ManageSubscription>.
      </p>
    </article>
  { /if }
</main>

<style>
  main {
    background-position: bottom right;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('/images/v1602510330/postscript-medical/annotation-app/bg_logo.svg'),
      linear-gradient(
        to right,
        white,
        white 45%,
        rgb(55, 154, 70) 45%
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