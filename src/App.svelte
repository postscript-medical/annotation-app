<script>
  import GoTrue from 'gotrue-js';
  import SignUpForm from  './components/SignUpForm.svelte';
  import LogInForm from './components/LogInForm.svelte';
  import LogOutButton from './components/LogOutButton.svelte';
  import {
    session,
    user,
    isLoading,
    protectedContent
  } from './stores.js';
  import loadProtectedContent from './methods/load-protected-content.js';

  $: console.log('> session:', $session);
  $: console.log('> user:', $user);

  async function initAuthentication () {
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
          alert('Account confirmed, sign in');
        })
        .catch(error => {
          console.error('Error:', error);
        })
    } else {
      console.log('try to load content');
      loadProtectedContent($user);
    }
  };

  initAuthentication();
</script>

<main>
  { #if $isLoading }
    <div>
    Please wait...
    </div>
  { :else if $user }
    <p>User is: { $user.email }</p>
    <LogOutButton />
  { :else }
    <SignUpForm />
    <LogInForm />
  { /if }
  <h1>
    { $protectedContent }
  </h1>
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