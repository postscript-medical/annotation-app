<script>
  import GoTrue from 'gotrue-js';
  import {
    session,
    user,
    isLoading,
    organization,
    protectedContent,
    showManageTeamModal,
  } from './stores.js';
  import {
    STORAGE_KEY,
    SUBSCRIPTION_PLANS_PAID,
  } from './constants/session.js'
  import loadProtectedContent from './methods/load-protected-content.js';
  import checkPasswordRequirements from './methods/check-password-requirements.js';
  import ErrorModal from './modals/ErrorModal.svelte';
  import ImageAnnotation from './screens/ImageAnnotation.svelte';
  import LoadingOverlay from './components/LoadingOverlay.svelte';
  import Index from './screens/Index.svelte';
  import PsHeader from './components/PsHeader.svelte';
  import FreeUserIndex from './screens/FreeUserIndex.svelte';
  import ResetPasswordModal from './modals/ResetPasswordModal.svelte';
  import ManageTeamModal from './modals/ManageTeamModal.svelte';

  let emailConfirmed = false;
  let error;
  let errorMessage = '';
  let loading = false;
  let showResetPasswordModal = false;
  let hasPaymentDetails = false;

  $: hasPaymentDetails = $organization && !!($organization.subscriptionLevel !== 'inactive');
  $: showTutorial = $protectedContent && $protectedContent.showTutorial;

  function clearErrors () {
    error = undefined;
    errorMessage = '';
  }

  function closeResetPasswordModal () {
    showResetPasswordModal = false;

    navigateHome();

    window.location.reload()
  }

  async function confirmUserSignUp (token) {
    const response = await $session
      .confirm(token)
      .catch(err => {
        error = err.json
      });

    if (!response) return;

    await loadProtectedContent($user);

    emailConfirmed = true;

    navigateHome();

  };

  function handleErrorModalClosed () {
    clearErrors();

    navigateHome();
  };

  function navigateHome() {
    window.location.hash = '';

    $isLoading = false;
  };

  async function getUserFromSessionStorage () {
    const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (!sessionStorage) return false;

    const { email, password } = JSON.parse(sessionStorage);

    try {
      const user = await $session.login(email, password);

      return user;
    } catch (err) {
      console.error('Error:', err);

      window.sessionStorage.removeItem(STORAGE_KEY);

      $isLoading = false;

      return false;
    }
  };

  async function initAuthentication () {
    $isLoading = true;

    const response = await new GoTrue.default({
      APIUrl: 'https://boring-wozniak-bbc476.netlify.app/.netlify/identity',
      setCookie: true,
    });

    if (!response) return;

    $session = response;
    $user = await (getUserFromSessionStorage() || $session.currentUser());

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
      await loadProtectedContent($user);

      $isLoading = false;
    }
  };

  async function recoverUserAccount (token) {
    const response = await $session
      .recover(token, true)
      .catch(err => {
        error = err.json
      })

    if (response) {
      $user = response;
  
      showResetPasswordModal = true;
    }
  };

  async function resetUserPassword ({ detail: password }) {
    const isPasswordGood = checkPasswordRequirements(password);

    errorMessage = '';

    if (!isPasswordGood) {
      errorMessage = 'Password does not meet criteria.';

      return;
    }

    loading = true;

    $user.update({ password })
      .then(updatedUser => {
        $user = updatedUser

        loading = false;
      })
      .catch((err) => {
        console.error('Failed to update user: %o', err);
        throw err;
      });

  };

  // TODO: Put this in the onMount() and potentially create a skeleton page to show.
  initAuthentication();
</script>


<PsHeader
  loggedIn={ !!$user }
  { hasPaymentDetails }
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
    { errorMessage }
    { loading }
    on:clear-errors={ clearErrors }
    on:close={ closeResetPasswordModal }
    on:reset-password{ resetUserPassword }
  />
{ :else if $showManageTeamModal }
  <ManageTeamModal
    team={ $protectedContent.team }
    user={ $user }
    maxUsers={ $organization.maxUsers }
    on:close={ () => $showManageTeamModal = false }
  />
{ :else if error }
  <ErrorModal
    on:close={ handleErrorModalClosed }
  >
    <p>
      { error && error.msg }
    </p>
  </ErrorModal>
{ :else }
  <LoadingOverlay
    loading={ $isLoading }
  />
{ /if }
