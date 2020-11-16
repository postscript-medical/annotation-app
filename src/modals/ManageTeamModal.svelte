<script>
  import {
    createEventDispatcher,
    onMount,
  } from 'svelte';
  import {
    organization,
    protectedContent,
    session,
  } from '../stores.js';
  import loadProtectedContent from '../methods/load-protected-content.js';
  import ErrorMessage from '../components/ErrorMessage.svelte';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';
  import PsDropdown from '../components/PsDropdown.svelte';
  import PsTextInput from '../components/PsTextInput.svelte';

  const ROLE_USER = 'user';
  const ROLE_ADMIN = 'admin';

  export let team;
  export let user;
  export let maxUsers = 1;

  const dispatch = createEventDispatcher();
  const roles = [ROLE_USER, ROLE_ADMIN];

  let errorMessage;
  let members = [];
  let teamName;

  $: totalUsersAssigned = members.length;
  $: totalUsersLeft = maxUsers - totalUsersAssigned;
  $: disabled = totalUsersLeft < 1;
  $: maxUserIndex = maxUsers - 1;
  $: hasUninvitedUser = !!members.find(({ toInvite }) => toInvite);

  function addUser () {
    members = [
      ...members,
      {
        email: '',
        firstName: '',
        lastName: '',
        role: ROLE_USER,
        toInvite: true,
      }
    ]
  };

  async function removeUser ({ netlifyID, _id: userID}) {
    // TODO: first delete user from Netlify, on success remove it from local list
    errorMessage = '';

    const token = user ? await user.jwt(true) : false;

    if (!token) {
      errorMessage = 'Could not validate your token. Please contact support.';

      return;
    };

    if (!userID) {
      errorMessage = 'Not a valid user.';

      return;
    }

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

    members = [...members.filter(({ _id }) => _id !== userID)];
  };

  async function saveNewUser ({ email, firstName, lastName, role }) {
    errorMessage = '';

    const token = user ? await user.jwt(true) : false;

    if (!token) {
      errorMessage = 'Could not validate your token. Please contact support.';

      return;
    };

    if (!email) {
      // TODO: when error occurs, it should highlight the missing fields
      errorMessage = 'Please provide an email address';

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

    if (!response || !response.ok) {
      errorMessage = 'No user created. Check the details or contact support.'
      return;
    };

    updateUserProperty('toInvite', false, email);

    // send welcome email with a reset password link to the newly created user.
    sendEmail(email, firstName);
  };

  async function saveUpdatedUser ({ email, firstName, lastName, role, netlifyID, _id: userID }) {
    errorMessage = '';

    const token = user ? await user.jwt(true) : false;

    if (!token) {
      errorMessage = 'Could not validate your token. Please contact support.';

      return;
    };

    if (!email) {
      // TODO: when error occurs, it should highlight the missing fields
      errorMessage = 'Please provide an email address';

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

    if (!response || !response.ok) {
      errorMessage = 'No user updated. Check the details or contact support.'
      return;
    };
  };

  async function sendEmail(email, firstName) {
    await emailjs.send('5609467','ps_team_member_welcome', {
      from_email: user.email,
      from_name: user.full_name || 'admininstrator',
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

  async function submit(event) {
    // TODO: reload the data from the server before closing the modal
    await loadProtectedContent(user);

    // TODO: loading spinner or the sort

    dispatch('close');
  };

  function updateUserProperty(key, value, userEmail) {
    // TODO: first update user in FaunaDB via Netlify functions before updating the local copy
    members = members.map(member => {
      if (member.email === userEmail) {
        return {
          ...member,
          [key]: value,
        };
      }

      return member;
    })
  }

  function updateTeamName ({ detail: value }) {
    teamName = value;
  };

  onMount(() => {
    emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");

    teamName = team.name;
    members = [...team.members];
  });
</script>

<Modal
  on:close
>
  <h2
    slot="header"
  >
    Team management
  </h2>

  <ErrorMessage
    message={ errorMessage }
  />

  <form
    on:submit|preventDefault={ submit }
  >
    <PsTextInput
      value={ teamName }
      on:input={ updateTeamName }
    >
      Team name
    </PsTextInput>
    <div>
      { totalUsersLeft } of { maxUsers } user slots left
    </div>
    <div
      class="team-grid"
    >
      <span>First name</span>
      <span>Last name</span>
      <span>Email</span>
      <span>Role</span>
      <span>Action</span>
      <span>Status</span>
      { #each members as member, index }
        <PsTextInput
          value={ member.firstName }
          disabled={ index > maxUserIndex }
          on:input={ ({ detail: value }) => updateUserProperty('firstName', value, member.email) }
        />
        <PsTextInput
          value={ member.lastName }
          disabled={ index > maxUserIndex }
          on:input={ ({ detail: value }) => updateUserProperty('lastName', value, member.email) }
        />
        <PsTextInput
          value={ member.email }
          disabled={ index > maxUserIndex }
          on:input={ ({ detail: value }) => updateUserProperty('email', value, member.email) }
        />
        <PsDropdown
          options={ roles }
          selected={ member.role }
          disabled={ index > maxUserIndex }
          on:change={ ({ detail: value }) => updateUserProperty('role', value, member.email) }
        />
        <!-- TODO: Create a warning style -->
        <PsButton
          style="secondary"
          on:click={ () => removeUser(member) }
          disabled={ member.email === user.email }
        >
          Remove user
        </PsButton>
        { #if member.toInvite }
          <PsButton
            on:click={ () => saveNewUser(member) }
          >
            Create user
          </PsButton>
        { :else }
          <PsButton
            on:click={ () => saveUpdatedUser(member) }
          >
            Save user
          </PsButton>
        { /if }
      { /each }
      <!-- TODO limite the addition of user to one at a time -->
      <PsButton
        style='secondary'
        on:click={ addUser }
        { disabled }
      >
        Add user
      </PsButton>
    </div>

    <PsButton 
      type="submit"
      disabled={ hasUninvitedUser }
    >
      Save
    </PsButton>
  </form>
</Modal>

<style>
  .team-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-gap: 1rem 0.5rem;
  }
  .team-grid > :global(:last-child) {
    grid-column-end: -1;
  }
</style>