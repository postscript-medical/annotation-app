<script>
  import GoTrue from 'gotrue-js';
  import {
    session,
    user,
    isLoading,
  } from './stores.js';
  import { STORAGE_KEY } from './constants/session.js'
  import loadProtectedContent from './methods/load-protected-content.js';
  import LoadingOverlay from './components/LoadingOverlay.svelte';
  import LoginSignUp from './screens/LoginSignUp.svelte';
  import ImageAnnotation from './screens/ImageAnnotation.svelte';

  $: console.log('> session:', $session);
  $: console.log('> user:', $user);

  let emailConfirmed = false;

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
        // Navigate to Stripe's payment provider
        // wait for confirmation from Stripe before progressing
        $session
          .confirm(token)
          .then(response => {
            console.log("Account confirmed! Welcome to the party!", JSON.stringify({ response }));

            window.location.hash = '';

            emailConfirmed = true;

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

{ #if $user }
  <ImageAnnotation />
{ :else }
  <LoginSignUp
    showEmailConfirmed={ emailConfirmed }
  />
{ /if }

{ #if $isLoading }
  <LoadingOverlay />
{ /if }