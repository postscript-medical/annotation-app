<script>
  import GoTrue from 'gotrue-js';
  import {
    session,
    user,
    isLoading,
    protectedContent
  } from './stores.js';
  import { STORAGE_KEY } from './constants/session.js'
  import loadProtectedContent from './methods/load-protected-content.js';
  import SignUpForm from  './components/SignUpForm.svelte';
  import LogInForm from './components/LogInForm.svelte';
  import LogOutButton from './components/LogOutButton.svelte';
  import ManageSubscriptionButton from './components/ManageSubscriptionButton.svelte';

  $: console.log('> session:', $session);
  $: console.log('> user:', $user);

  async function getUserFromSessionStorage () {
    const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (!sessionStorage) return false;

    const { email, password } = JSON.parse(sessionStorage);

    $isLoading = true;

    const user = await $session.login(email, password);

    $isLoading = false;

    return user;
  }

  async function initAuthentication () {
    let response = await new GoTrue.default({
      APIUrl: 'https://boring-wozniak-bbc476.netlify.app/.netlify/identity',
      setCookie: true,
    });

    console.log('response:', response);

    $session = response;
    $user = await getUserFromSessionStorage() || $session.currentUser();

    const hash = window.location.hash;

    if (hash) {
      const [hashId, token] = hash.split('=');

      if (hashId !== '#confirmation_token') return ;

      $session
        .confirm(token)
        .then(response => {
          console.log("Account confirmed!Welcome to the party!", JSON.stringify({ response }));
          // navigate to the main url
          window.location.hash = '';
          alert('Account confirmed, sign in');
          loadProtectedContent($user);
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
  { /if }
  { #if $user }
    <p>User is: { $user.email }</p>
    <LogOutButton />
    <ManageSubscriptionButton />
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