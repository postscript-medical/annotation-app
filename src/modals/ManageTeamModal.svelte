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
  const roles = [ROLE_USER];

  let errorMessage;
  let members = [];
  let teamName;
  let editingUserIndex;

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
    ];

    editingUserIndex = totalUsersAssigned;
  };

  async function removeUser ({ netlifyID, _id: userID}) {
    // TODO: Move this logic to the parent component
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
  confirmBtCopy="Save changes"
  on:confirm={ submit }
  on:close
>
  <span
    slot="header"
  >
    Team management
  </span>
  <ErrorMessage
    message={ errorMessage }
  />
  <PsTextInput
    editable={ false }
    value={ teamName }
    on:input={ updateTeamName }
  >
    Team name
  </PsTextInput>
  <div
    class="usage-container"
  >
    { totalUsersLeft } of { maxUsers } user slots left
  </div>
  <table>
    <thead>
      <tr>
        <th>
          First name
        </th>
        <th>
          Last name
        </th>
        <th>
          Email
        </th>
        <th>
          Role
        </th>
        <th>
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      { #each members as member, index }
        <tr>
          <td>
            <PsTextInput
              editable={ editingUserIndex === index }
              value={ member.firstName }
              disabled={ index > maxUserIndex }
              on:input={ ({ detail: value }) => updateUserProperty('firstName', value, member.email) }
            />
          </td>
          <td>
            <PsTextInput
              editable={ editingUserIndex === index }
              value={ member.lastName }
              disabled={ index > maxUserIndex }
              on:input={ ({ detail: value }) => updateUserProperty('lastName', value, member.email) }
            />
          </td>
          <td>
            <PsTextInput
              editable={ editingUserIndex === index }
              value={ member.email }
              disabled={ index > maxUserIndex }
              on:input={ ({ detail: value }) => updateUserProperty('email', value, member.email) }
            />
          </td>
          <td>
            <PsDropdown
              editable={ editingUserIndex === index && member.email !== user.email}
              options={ roles }
              selected={ member.role }
              disabled={ index > maxUserIndex }
              on:change={ ({ detail: value }) => updateUserProperty('role', value, member.email) }
            />
          </td>
          <td>
            <PsButton
              asLink
              style="secondary"
              on:click={ () => removeUser(member) }
              disabled={ member.email === user.email }
            >
              Remove
            </PsButton>
            /
            { #if editingUserIndex !== index }
              <PsButton
                asLink
                style="secondary"
                on:click={ () => editingUserIndex = index }
              >
                Edit
              </PsButton>
            { :else }
              { #if member.toInvite }
                <PsButton
                  asLink
                  style="secondary"
                  on:click={ () => saveNewUser(member) }
                >
                  Create
                </PsButton>
              { :else }
                <PsButton
                  asLink
                  style="secondary"
                  on:click={ () => saveUpdatedUser(member) }
                >
                  Save
                </PsButton>
              { /if }
              /
              <PsButton
                asLink
                style="secondary"
                on:click={ () => editingUserIndex = undefined }
              >
                Cancel
              </PsButton>
            { /if }
          </td>
        </tr>
      { /each }
    </tbody>
  </table>
  <div>
    <PsButton
      style='secondary'
      on:click={ addUser }
      { disabled }
    >
      Add user
    </PsButton>
  </div>
</Modal>

<style>
  table {
    border-collapse: collapse;
  }
  table :global(*) {
    white-space: nowrap;
  }
  td, th {
    /* border: 1px solid #999; */
    padding: 0.5rem;
  }

  .usage-container {
    display: flex;
    justify-content: flex-end;
  }
</style>