<script>
  import { onMount } from 'svelte';
  import GoTrue from 'gotrue-js';
  import { session } from '../session.js';

  function loginUser (e) {
    console.log('Log user in', e);
    e.preventDefault();
    const form = e.target;

    if (!auth) {
      console.log('No auth object!');
      return;
    }

    const {
      email,
      password
    } = form.elements;

    auth
      .login(email.value, password.value)
      .then(response => {
        console.log('Success', response);
      })
      .catch(error => {
        console.error("Error:", error);
      })
  }

  async function getAuthentication () {
    let response = await new GoTrue.default({
      APIUrl: 'https://boring-wozniak-bbc476.netlify.app/.netlify/identity',
    });

    console.log('response:', response);

    $session = response;

    const hash = location.hash;
    if (hash) {
      const [tokenId, token] = hash.split('=');

      console.log('bits', tokenId, token)

      if (tokenId === '') return ;
      $session
        .confirm(token)
        .then(response => {
          console.log("Account confirmed!Welcome to the party!", JSON.stringify({ response }));
        })
        .catch(error => {
          console.error('Error:', error);
        })
    }
  }

  onMount(() => {
    getAuthentication();
  });
</script>

<svelte:head>
	<title>PostScript Digital</title>
</svelte:head>

<form name="login" on:submit|preventDefault={ loginUser }>
    <label>
    Email
    <input type="email" name="email" />
  </label>
  <label>
    Password
    <input type="password" name="password" />
  </label>
  <button type="submit">
    Log in
  </button>
</form>