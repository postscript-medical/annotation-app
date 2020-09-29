<script>
  import GoTrue from 'gotrue-js';
  import {
    session,
    user,
    isLoading,
  } from './stores.js';
  import { STORAGE_KEY } from './constants/session.js'
  import loadProtectedContent from './methods/load-protected-content.js';
  import SignUpForm from  './components/SignUpForm.svelte';
  import LogInForm from './components/LogInForm.svelte';
  import LoadingOverlay from './components/LoadingOverlay.svelte';
  import SketchPad from './components/sketchpad/SketchPad.svelte';

  $: console.log('> session:', $session);
  $: console.log('> user:', $user);

  let showSignUpForm = true;

  async function getUserFromSessionStorage () {
    const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (!sessionStorage) return false;

    const { email, password } = JSON.parse(sessionStorage);

    const user = await $session.login(email, password);

    return user;
  }

  async function initAuthentication () {
    $isLoading = true;

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

      if (hashId === '#confirmation_token') {
        $session
          .confirm(token)
          .then(response => {
            console.log("Account confirmed!Welcome to the party!", JSON.stringify({ response }));

            window.location.hash = '';

            // alert('Account confirmed, sign in');
            loadProtectedContent($user);
            // TODO: wait a frame before toggling this
            $isLoading = false;
          })
          .catch(error => {
            console.error('Error:', error);
          })
      };
    } else {
      loadProtectedContent($user);
      // TODO: wait a frame before toggling this
      $isLoading = false;
    }
  };

  initAuthentication();
</script>

<main>
  { #if $user }
    <SketchPad />
  { :else }
    { #if showSignUpForm }
      <SignUpForm />
    { /if }
    <LogInForm />
  { /if }
</main>

{ #if $isLoading }
  <LoadingOverlay />
{ /if }


<style>
  main {
    padding: 0;
    margin: 0;
    position: relative;
    height: 100%;
    background: lightgrey;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>