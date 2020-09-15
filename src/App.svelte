<script>
  import GoTrue from 'gotrue-js';
  import { session, user } from './session.js';
  import SignUpForm from  './components/SignUpForm.svelte';
  import LogInForm from './components/LogInForm.svelte';
  import LogOutButton from './components/LogOutButton.svelte';

  $: console.log('> logging:', $session);
  $: console.log('> user:', $user);

  async function getAuthentication () {
    let response = await new GoTrue.default({
      APIUrl: 'https://boring-wozniak-bbc476.netlify.app/.netlify/identity',
      setCookie: true,
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

  getAuthentication();
</script>

<main>
  { #if $user }
    <p>User is: { $user.email }</p>
    <LogOutButton />
  { :else }
    <SignUpForm />
    <LogInForm />
  { /if }
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>