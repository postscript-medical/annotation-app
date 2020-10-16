<script>
  import { user } from '../stores.js';
  import ManageSubscription from '../components/ManageSubscription.svelte';
</script>

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
        To do so, just click <ManageSubscription user={ $user }> on this link to manage your subscription</ManageSubscription>.
      </p>
    </article>
  { /if }
</main>