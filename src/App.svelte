<script>
  import GoTrue from 'gotrue-js';
  import {
    session,
    user,
    isLoading,
  } from './stores.js';
  import {
    STORAGE_KEY,
    SUBSCRIPTION_PLANS_PAID,
  } from './constants/session.js'
  import loadProtectedContent from './methods/load-protected-content.js';
  import ImageAnnotation from './screens/ImageAnnotation.svelte';
  import LoadingOverlay from './components/LoadingOverlay.svelte';
  import Index from './screens/Index.svelte';
  import PsHeader from './components/PsHeader.svelte';
  import FreeUserIndex from './screens/FreeUserIndex.svelte';

  let emailConfirmed = false;

  $: hasPaymentDetails = $user && !!($user.app_metadata.roles.find(role => SUBSCRIPTION_PLANS_PAID.includes(role)));

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

    $session = response;
    $user = await getUserFromSessionStorage() || $session.currentUser();

    const hash = window.location.hash;

    if (hash) {
      const [hashId, token] = hash.split('=');

      if (hashId === '#confirmation_token') {
        $session
          .confirm(token)
          .then(response => {
            window.location.hash = '';

            emailConfirmed = true;

            loadProtectedContent($user);

            $isLoading = false;
          })
          .catch(error => {
            const code = error.json.code
            if (code === 404) {
              console.warn(error.json.msg);

              window.location.hash = '';

              loadProtectedContent();

              $isLoading = false;
            } else {
              console.error('Error:', error);
            }
          })
      };
    } else {
      loadProtectedContent($user);

      $isLoading = false;
    }
  };

  // TODO: Put this in the onMount() and potentially create a skeleton page to show.
  initAuthentication();
</script>


<PsHeader
  loggedIn={ hasPaymentDetails }
  user={ $user }
/>

{ #if hasPaymentDetails }
  <ImageAnnotation />
{ :else if $user }
  <FreeUserIndex />
{ :else }
  <Index
    showEmailConfirmed={ emailConfirmed }
    on:email-confirmed={ () => emailConfirmed = false }
  />
{ /if }

{ #if $isLoading }
  <LoadingOverlay />
{ /if }