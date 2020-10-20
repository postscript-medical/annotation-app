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
  import ResetPasswordModal from './modals/ResetPasswordModal.svelte';

  let emailConfirmed = false;
  let showResetPasswordModal = false;
  let hasPaymentDetails = false;

  $: {
    if ($user) {
      console.log($user);
      hasPaymentDetails = $user && !!($user.app_metadata.roles.find(role => SUBSCRIPTION_PLANS_PAID.includes(role)));}
    }

  function closeResetPasswordModal () {
    showResetPasswordModal = false;
  }

  function confirmUserSignUp (token) {
    $session
      .confirm(token)
      .then(response => {
            emailConfirmed = true;

            loadProtectedContent($user);

            $isLoading = false;

            navigateHome();
          })
          .catch(error => {
            const code = error.json.code;

            if (code === 404) {
              console.warn(error.json.msg);

              loadProtectedContent();

              $isLoading = false;

              navigateHome();
            } else {
              console.error('Error:', error);
            }
          })
  };

  function navigateHome() {
    window.location.hash = '';
  };

  async function getUserFromSessionStorage () {
    const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (!sessionStorage) return false;

    const { email, password } = JSON.parse(sessionStorage);

    try {
      const user = await $session.login(email, password);

      return user;
    } catch (error) {
      console.error('Error:', error);

      window.sessionStorage.removeItem(STORAGE_KEY);

      $isLoading = false;

      return false;
    }
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

      switch (hashId) {
        case '#confirmation_token':
          confirmUserSignUp(token);
          break;

        case '#recovery_token':
          recoverUserAccount(token);
          break;

        default:
          break;
      };
    } else {
      loadProtectedContent($user);

      $isLoading = false;
    }
  };

  function recoverUserAccount (token) {
    $session
      .recover(token, true)
      .then(response => {
        console.log('Logged in as %s', JSON.stringify({ response }));
        $user = response;

        showResetPasswordModal = true;

        $isLoading = false;

        navigateHome();
      })
      .catch(error => {
        console.log('Failed to verify recover token: %o', error);

        $isLoading = false;

        navigateHome();
      });
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

{ #if showResetPasswordModal }
  <ResetPasswordModal
    on:close={ closeResetPasswordModal }
  />
{ /if }

{ #if $isLoading }
  <LoadingOverlay />
{ /if }