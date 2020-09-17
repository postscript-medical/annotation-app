<script>
  import { user } from '../stores.js';

  function openStripeCustomePortal () {
    console.log('user:', user.token.access_token)
    fetch('/.netlify/functions/create-manage-link', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${$user.token.access_token}`,
      },
    })
      .then(response => response.json())
      .then(link => {
        // TODO: Make sure the navigation is registered in the browser's history
        window.location.href = link;
      })
      .catch(error => console.error(error))
  }
</script>

<button on:click={ openStripeCustomePortal }>
  Manage subscription
</button>