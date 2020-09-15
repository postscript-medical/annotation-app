<script>
  import { onMount } from 'svelte';
  import GoTrue from 'gotrue-js';
  import { session } from '../session.js';
  import SignUpForm from  '../components/SignUpForm.svelte';
  import LogInForm from '../components/LogInForm.svelte';

  $: user

  async function getAuthentication () {
    let response = await new GoTrue.default({
      APIUrl: 'https://boring-wozniak-bbc476.netlify.app/.netlify/identity',
    });

    console.log('response:', response);

    $session = response;

    const hash = location.hash;

    if (hash) {
      const [tokenId, token] = hash.split('=');

      if (tokenId !== '#confirmation_token') return ;

      $session
        .confirm(token)
        .then(response => {
          console.log("Account confirmed!Welcome to the party!", JSON.stringify({ response }));
          // navigate to the main url
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

<SignUpForm />
<LogInForm />

<p>User: </p>