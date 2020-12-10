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
    ROLE_OWNER,
  } from './constants/defaults.js';
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
  let error_message = '';
  let loading = false;
  let showResetPasswordModal = false;

  $: hasPaymentDetails = $organization && !!($organization.subscriptionLevel !== 'inactive');
  $: showTutorial = $protectedContent && $protectedContent.showTutorial;
  $: teamMembers = ($protectedContent && $protectedContent.team.members.filter(({ role })  => role !== ROLE_OWNER)) || [];
  $: teamName = ($protectedContent && $protectedContent.team.name) || '';

  function add_new_team_member (teamMember) {
    $protectedContent.team.members = [
      ...$protectedContent.team.members,
      teamMember,
    ];
  };

  function clear_errors () {
    error = null;

    error_message = '';
  };

  function close_email_confirmed_modal () {
    emailConfirmed = false;
  };

  function close_reset_password_modal () {
    showResetPasswordModal = false;

    navigate_home();

    window.location.reload();
  };

  function close_manage_team_modal () {
    $protectedContent.team.members = $protectedContent.team.members.filter(({ toInvite }) => !toInvite);

    $showManageTeamModal = false;
  };

  async function confirm_user_sign_up (token) {
    const response = await $session
      .confirm(token)
      .catch(err => {
        error = err.json
      });

    if (!response) return;

    await loadProtectedContent($user);

    emailConfirmed = true;

    navigate_home();
  };

  async function get_user_from_session_storage () {
    const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (!sessionStorage) return false;

    const { email, password } = JSON.parse(sessionStorage);

    try {
      const user = await $session.login(email, password);

      return user;
    } catch (err) {
      window.sessionStorage.removeItem(STORAGE_KEY);

      $isLoading = false;

      return false;
    }
  };

  function handle_error_modal_closed () {
    clear_errors();

    navigate_home();
  };

  function handle_team_update ({ detail }) {
    const { teamMember, teamName, action, index } = detail;

    switch (action) {
      case 'add-new-team-member':
        add_new_team_member(teamMember);
        break;

      case 'update-team-member':
        update_team_member(teamMember, index);
        break;

      case 'remove-team-member':
        remove_team_member(teamMember);
        break;

      case 'save-new-team-member':
        save_new_team_member(teamMember);
        break;

      case 'save-updated-team-member':
        save_updated_team_member(teamMember);
        break;

      case 'save-updated-team-name':
        save_updated_team_name(teamName);
        break;
    }
  };

  async function init_authentication () {
    $isLoading = true;

    const response = await new GoTrue.default({
      APIUrl: 'https://boring-wozniak-bbc476.netlify.app/.netlify/identity',
      setCookie: true,
    });

    if (!response) {
      $isLoading = false;

      return;
    };

    $session = response;

    $user = await (get_user_from_session_storage() || $session.currentUser());

    const hash = window.location.hash;

    if (hash) {
      const [hashId, token] = hash.split('=');

      switch (hashId) {
        case '#confirmation_token':
          confirm_user_sign_up(token);
          break;

        case '#recovery_token':
          recover_user_account(token);
          break;

        default:
          break;
      };
    } else {
      await loadProtectedContent($user);

      $isLoading = false;
    }
  };

  function navigate_home() {
    window.location.hash = '';

    $isLoading = false;
  };

  async function netlify_function (url, user, params) {
    const token = user ? await user.jwt() : false;

    if (!token) {
      return Promise.reject(new Error('Could not validate your token. Please contact support.'));
    }

    const response = await fetch(url, {
      method: params.method || 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify(params.body || {}),
    })
    .catch(err => Promise.reject(new Error(`Error ${err.message}`)));

    if (!response.ok) {
      const err = await response.json();

      return Promise.reject(new Error(err.message));
    };

    return response;
  };

  async function recover_user_account (token) {
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

  async function remove_team_member (team_member) {
    const { netlifyID, _id: userID} = team_member;

    if (netlifyID && userID) {
      /**
       * NOTE: This call ALWAYS fails when in localhost!
      */
      const response = await save_team_change(
        '/.netlify/functions/remove-team-member',
        {
          body: {
            userID,
            netlifyID,
          },
        }
      ).catch(err => error_message = err.message);

      if (!response) return;
    }

    $protectedContent.team.members = [...$protectedContent.team.members.filter(({ _id }) => _id !== userID)];
  };

  async function reset_user_password ({ detail: password }) {
    const is_passwordGood = checkPasswordRequirements(password);

    clear_errors();

    if (!is_passwordGood) {
      error_message = 'Password does not meet criteria.';

      return;
    }

    loading = true;

    $user.update({ password })
      .then(updated_user => {
        $user = updated_user;

        loading = false;
      })
      .catch((err) => {
        error_message = `Failed to update user: ${err.message}`;
      });
  };

  async function save_new_team_member ({ email, firstName, lastName, role }) {
    /**
     * NOTE: This call ALWAYS fails when in localhost!
    */
    
    const response = await save_team_change(
      '/.netlify/functions/add-team-member',
      {
        body: {
          email,
          firstName,
          lastName,
          password: '123', /* TODO: generate a random password */
          role,
          teamID: $protectedContent.team._id,
        },
      }
    ).catch(err => {
      error_message = err.message;

      return;
    });

    if (!response) return;

    // send welcome email with a reset password link to the newly created user.
    send_email(email, firstName);

    // Reload the data from the server
    loadProtectedContent($user);
  };

  async function save_team_change (url, params) {
    loading = true;

    clear_errors();

    const response = await netlify_function(url, $user, params)
      .catch(err => {
        loading = false;

        return Promise.reject(new Error(err.message));
      });

    loading = false;

    return response;
  };

  async function save_updated_team_member ({ email, firstName, lastName, role, netlifyID, _id: userID }) {
    const response = await save_team_change(
      '/.netlify/functions/update-team-member',
      {
        body: {
          email,
          firstName,
          lastName,
          role,
          netlifyID,
          userID,
          teamID: $protectedContent.team._id,
        },
      }
    ).catch(err => error_message = err.message);

    if (!response) return;

    // Reload the data from the server
    loadProtectedContent($user);
  };

  async function save_updated_team_name (name) {
    const response = await save_team_change(
      '/.netlify/functions/update-team-properties',
      {
        body: {
          name,
          teamID: $protectedContent.team._id,
        },
      }
    ).catch(err => {
      error_message = err.message;
    });

    if (!response) return;

    // Reload the data from the server
    loadProtectedContent($user);
  };

  async function send_email(email, firstName) {
    // TODO: Consider moving this call to Netlify functions
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
        console.log('Recovery email sent.');
      })
      .catch(err => {
        console.log('Error sending email:', err);

        error_message = `Error sending invitation email ${err.message}`
      });
  };

  function update_team_member (team_member) {
    const updated_members = [...$protectedContent.team.members];
    /*
      This works even when _id is undefined because the only way it is so
      is when we add a new, unsaved, member to the list.
      When that happens, both _id and team_member._id are undefined thus, returning the correct index.
    */
    const index = updated_members.findIndex(({ _id }) => _id === team_member._id)

    updated_members.splice(index, 1, team_member);

    $protectedContent.team.members = updated_members;
  };

  function update_team_name ({ detail: name }) {
    $protectedContent.team.name = name;
  };

  // TODO: Put this in the onMount() and potentially create a skeleton page to show.
  init_authentication();
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
    on:email-confirmed={ close_email_confirmed_modal }
  />
{ /if }

{ #if showResetPasswordModal }
  <ResetPasswordModal
    { error_message }
    { loading }
    on:clear-errors={ clear_errors }
    on:close={ close_reset_password_modal }
    on:reset-password{ reset_user_password }
  />
{ :else if $showManageTeamModal }
  <ManageTeamModal
    { error_message }
    { loading }
    { teamName }
    members={ teamMembers }
    maxTeamMembers={ $organization.maxUsers }
    on:close={ close_manage_team_modal }
    on:update={ handle_team_update }
    on:update-team-name={ update_team_name }
  />
{ :else if error }
  <ErrorModal
    on:close={ handle_error_modal_closed }
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
