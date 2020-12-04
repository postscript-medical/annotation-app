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
  $: teamMembers = ($protectedContent && $protectedContent.team.members) || [];
  $: teamName = ($protectedContent && $protectedContent.team.name) || '';

  function addNewTeamMember (teamMember) {
    $protectedContent.team.members = [
      ...$protectedContent.team.members,
      teamMember,
    ];
  };

  function clearErrors () {
    error = null;
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

  function handleErrorModalClosed () {
    clearErrors();

    navigateHome();
  };

  function handleTeamUpdate ({ detail }) {
    const { teamMember, action, index } = detail;

    switch (action) {
      case 'add-new-team-member':
        addNewTeamMember(teamMember);
        break;

      case 'update-team-member':
        updateTeamMember(teamMember, index);
        break;

      case 'remove-team-member':
        removeTeamMember(teamMember);
        break;

      case 'save-new-team-member':
        saveNewTeamMember(teamMember);
        break;

      case 'save-updated-team-member':
        saveUpdatedTeamMember(teamMember);
        break;

      default:
        break;
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

  function navigateHome() {
    window.location.hash = '';

    $isLoading = false;
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

  async function removeTeamMember (teamMember) {
    clearErrors();

    if (teamMember.toInvite) {
      $protectedContent.team.members = $protectedContent.team.members.filter(({ toInvite }) => !toInvite);

      return;
    };

    const token = $user ? await $user.jwt() : false;

    if (!token) {
      errorMessage = 'Could not validate your token. Please contact support.';

      return;
    };

    const { netlifyID, _id: userID} = teamMember;

    /**
     * NOTE: This call ALWAYS fails when in localhost!
    */
    const response = await fetch('/.netlify/functions/remove-team-member', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({
        userID,
        netlifyID,
      }),
    });

    if (!response || !response.ok) {
      errorMessage = 'No user deleted. Check the details or contact support.'
      return;
    };

    $protectedContent.team.members = [...$protectedContent.team.members.filter(({ _id }) => _id !== userID)];
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

  async function saveNewTeamMember ({ email, firstName, lastName, role }) {
    loading = true;

    clearErrors();

    const token = $user ? await $user.jwt() : false;

    if (!token) {
      errorMessage = 'Could not validate your token. Please contact support.';

      return;
    };

    // TODO: generate a random password that needs to be sent to the user / or a reset password must be triggered when the user confirms their email
    /**
     * NOTE: This call ALWAYS fails when in localhost!
    */
    const response = await fetch('/.netlify/functions/add-team-member', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        password: '123',
        role,
        teamID: $protectedContent.team._id,
      }),
    });

    loading = false;

    console.log('saveNewTeamMember', response);

    if (!response || !response.ok) {
      errorMessage = 'No user created. Check the details or contact support.'
      return;
    };

    // const updatedMembers = [...teamMembers];

    // updatedMembers.forEach(member => {
    //   delete member.toInvite;
    // });

    // $protectedContent.team.members = updatedMembers;

    // send welcome email with a reset password link to the newly created user.
    sendEmail(email, firstName);

    // Reload the data from the server
    await loadProtectedContent($user);
  };

  async function saveUpdatedTeamMember ({ email, firstName, lastName, role, netlifyID, _id: userID }) {
    loading = true;

    clearErrors();
    // We will trust the API to check for the bulk of validation
    const token = $user ? await $user.jwt() : false;

    if (!token) {
      errorMessage = 'Could not validate your token. Please contact support.';

      return;
    };

    const response = await fetch('/.netlify/functions/update-team-member', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        role,
        netlifyID,
        userID,
        teamID: $protectedContent.team._id,
      }),
    });

    loading = false;

    console.log('saveUpdatedTeamMember', response);

    if (!response || !response.ok) {
      errorMessage = 'No user updated. Check the details or contact support.'
      return;
    };

    // Reload the data from the server
    await loadProtectedContent($user);
  };

  async function sendEmail(email, firstName) {
    await emailjs.send('5609467','ps_team_member_welcome', {
      from_email: $user.email,
      from_name: $user.user_metadata.full_name || 'Admininstrator',
      org_name: $organization.name,
      team_name: teamName,
      to_email: email,
      to_name: firstName || 'there',
    });

    await $session
      .requestPasswordRecovery(email)
      .then(response => {
        console.log('Recovery sent', { response });
      })
      .catch(error => {
        console.log('Error sending email:', error);
      });
  }

  function updateTeamName ({ detail: name }) {
    console.log('updateTeamName');
    // TODO
  };

  function updateTeamMember (teamMember, index) {
    const updatedMembers = [...teamMembers];

    updatedMembers.splice(index, 1, teamMember);

    $protectedContent.team.members = updatedMembers;
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
    { errorMessage }
    { loading }
    { teamName }
    members={ teamMembers }
    maxTeamMembers={ $organization.maxUsers }
    on:close={ () => $showManageTeamModal = false }
    on:update={ handleTeamUpdate }
    on:update-team-name={ updateTeamName }
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
