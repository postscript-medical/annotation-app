<script>
  import { onMount } from 'svelte';
  export let user;

  let href;

  function getStripeCustomePortalUrl () {

    fetch('/.netlify/functions/create-manage-link', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.token.access_token}`,
      },
    })
      .then(response => response.json())
      .then(link => {
        href = link;
      })
      .catch(error => console.error(error))
  }

  onMount(() => {
    getStripeCustomePortalUrl();
  });
</script>

<a
  { href }
>
  <slot>
    Manage subscription
  </slot>
</a>