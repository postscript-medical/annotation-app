<script>
  /*global emailjs*/
  /*eslint no-undef: "error"*/
  import { ROLE_OWNER, ROLE_USER } from "../constants/defaults.js";
  import { session, user, organization, protectedContent } from "../stores.js";
  import load_protected_content from "../methods/load-protected-content.js";
  import netlify_function from "../methods/netlify-function.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

  const ROLES = [ROLE_USER];

  let editingTeamMemberIndex = null;
  let editedTeamMemberSrc;
  let editedTeamNameSrc;
  let errorMessage = "";
  let loading = false;
  let updatingTeamName = false;
  let updatingTeamMember = false;
  let creatingNewTeamMember = false;
  let teamMembersTable;

  $: teamMembers =
    ($protectedContent &&
      $protectedContent.team.members.filter(
        ({ role }) => role !== ROLE_OWNER
      )) ||
    [];
  $: teamName = ($protectedContent && $protectedContent.team.name) || "";
  $: totalTeamMembersAssigned = teamMembers.length;
  $: totalTeamMembersLeft = maxTeamMembers - totalTeamMembersAssigned;
  $: disabled =
    totalTeamMembersLeft < 1 || !!(typeof editingTeamMemberIndex === "number");
  $: maxTeamMembers = ($organization && $organization.maxUsers) || 1;
  $: maxTeamMemberIndex = maxTeamMembers - 1;

  function add_team_member() {
    const newTeamMember = {
      email: "",
      firstName: "",
      lastName: "",
      role: ROLE_USER,
      toInvite: true,
    };

    editedTeamMemberSrc = newTeamMember;

    $protectedContent.team.members = [
      ...$protectedContent.team.members,
      newTeamMember,
    ];

    editingTeamMemberIndex = totalTeamMembersAssigned;

    /* Wait for the new row to be placed in the DOM */
    requestAnimationFrame(() => {
      const { height } = teamMembersTable.getBoundingClientRect();

      teamMembersTable.parentNode.scroll(0, height);
    });
  }

  function cancel_team_member_edit(index) {
    editingTeamMemberIndex = null;

    if (editedTeamMemberSrc.toInvite) {
      remove_team_member(editedTeamMemberSrc);

      return;
    }

    update_team_member(editedTeamMemberSrc, index);
  }

  function clear_errors() {
    errorMessage = "";
  }

  function edit_team_member(teamMember, index) {
    editedTeamMemberSrc = { ...teamMember };

    editingTeamMemberIndex = index;
  }

  async function remove_team_member(teamMember) {
    const { netlifyID, _id: userID } = teamMember;

    if (netlifyID && userID) {
      /**
       * NOTE: This call ALWAYS fails when in localhost!
       */
      const response = await save_team_change(
        "/.netlify/functions/remove-team-member",
        {
          body: {
            userID,
            netlifyID,
          },
        }
      ).catch((err) => (errorMessage = err.message));

      if (!response) return;
    }

    $protectedContent.team.members = [
      ...$protectedContent.team.members.filter(({ _id }) => _id !== userID),
    ];
  }

  async function save_new_team_member({ email, firstName, lastName, role }) {
    creatingNewTeamMember = true;

    /**
     * NOTE: This call ALWAYS fails when in localhost!
     */
    const response = await save_team_change(
      "/.netlify/functions/add-team-member",
      {
        body: {
          email,
          firstName,
          lastName,
          password: "123" /* TODO: generate a random password */,
          role,
          teamID: $protectedContent.team._id,
        },
      }
    ).catch((err) => {
      errorMessage = err.message;

      return;
    });

    if (!response) return;

    // send welcome email with a reset password link to the newly created user.
    send_email(email, firstName);

    // Reload the data from the server
    load_protected_content($user);
  }

  async function save_updated_team_member({
    email,
    firstName,
    lastName,
    role,
    netlifyID,
    _id: userID,
  }) {
    updatingTeamMember = true;

    const response = await save_team_change(
      "/.netlify/functions/update-team-member",
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
    ).catch((err) => (errorMessage = err.message));

    if (!response) return;

    // Reload the data from the server
    load_protected_content($user);
  }

  async function send_email(email, firstName) {
    await emailjs.send("5609467", "ps_team_member_welcome", {
      from_email: $user.email,
      from_name: $user.user_metadata.full_name || "Admininstrator",
      org_name: $organization.name,
      team_name: teamName,
      to_email: email,
      to_name: firstName || "there",
    });

    $session
      .requestPasswordRecovery(email)
      .then(() => {
        console.log("Recovery email sent.");
      })
      .catch((err) => {
        console.log("Error sending email:", err);

        errorMessage = `Error sending invitation email ${err.message}`;
      });
  }

  function team_member_update_complete() {
    if (creatingNewTeamMember) creatingNewTeamMember = false;

    if (updatingTeamMember) updatingTeamMember = false;

    if (!errorMessage) editingTeamMemberIndex = null;
  }

  function team_name_update_complete() {
    updatingTeamName = false;

    if (!errorMessage) {
      editedTeamNameSrc = null;
    }
  }

  function toggle_edit_team_name(_teamName) {
    if (_teamName) {
      editedTeamNameSrc = _teamName;
    } else {
      update_team_name(editedTeamNameSrc);

      editedTeamNameSrc = null;
    }
  }

  function update_team_member_property(key, value, index) {
    update_team_member({ ...teamMembers[index], [key]: value });
  }

  function update_team_member(teamMember) {
    const updated_members = [...$protectedContent.team.members];
    /*
      This works even when _id is undefined because the only way _id is undefined is when we add a new, unsaved, member to the list.
      When that happens, both _id and teamMember._id are undefined thus, returning the correct index.
    */
    const index = updated_members.findIndex(
      ({ _id }) => _id === teamMember._id
    );

    updated_members.splice(index, 1, teamMember);

    $protectedContent.team.members = updated_members;
  }

  function update_team_name(name) {
    $protectedContent.team.name = name;
  }

  async function save_team_change(url, params) {
    loading = true;

    clear_errors();

    const response = await netlify_function(url, $user, params).catch((err) => {
      loading = false;

      return Promise.reject(new Error(err.message));
    });

    loading = false;

    return response;
  }

  async function save_updated_team_name() {
    updatingTeamName = true;

    const response = await save_team_change(
      "/.netlify/functions/update-team-properties",
      {
        body: {
          name: teamName,
          teamID: $protectedContent.team._id,
        },
      }
    ).catch((err) => {
      errorMessage = err.message;
    });

    if (!response) return;

    // Reload the data from the server
    load_protected_content($user);
  }
</script>

<main class="main-content central-align">
  <h2>Edit team</h2>
  <ErrorMessage message={errorMessage} />

  <section class="entry">
    <h3>Team details</h3>
    <div class="team-name">
      <PsTextInput
        disabled={loading || updatingTeamName}
        readonly={!editedTeamNameSrc}
        value={teamName}
        style="inline"
        on:input={({ detail: value }) => update_team_name(value)}>
        Team name:
      </PsTextInput>
      {#if !!editedTeamNameSrc}
        <PsButton
          {loading}
          style="secondary inline"
          on:click={save_updated_team_name}
          on:tween-out-complete={team_name_update_complete}>
          Save
        </PsButton>
        <PsButton
          disabled={loading || updatingTeamName}
          style="secondary inline"
          on:click={toggle_edit_team_name}>
          Cancel
        </PsButton>
      {:else}
        <PsButton
          disabled={loading}
          style="secondary inline"
          on:click={() => toggle_edit_team_name(teamName)}>
          Edit
        </PsButton>
      {/if}
    </div>
    <PsTextInput
      readonly
      value={`${totalTeamMembersLeft} of ${maxTeamMembers} user slots used`}
      style="inline">
      Usage:
    </PsTextInput>
  </section>

  <section class="team-members">
    <h3>Team members</h3>

    <div>
      <PsButton
        disabled={loading || disabled}
        style="tertiary"
        on:click={add_team_member}>
        + Add user
      </PsButton>
    </div>

    <div class="team-members-table">
      <table bind:this={teamMembersTable}>
        <thead>
          <tr>
            <th>First name</th>
            <th>Last name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each teamMembers as member, index}
            <tr>
              <td>
                <PsTextInput
                  readonly={editingTeamMemberIndex !== index}
                  size="30"
                  style="inline"
                  value={member.firstName}
                  placeholder="First name"
                  disabled={index > maxTeamMemberIndex}
                  on:input={({ detail: value }) => update_team_member_property('firstName', value, index)} />
              </td>
              <td>
                <PsTextInput
                  readonly={editingTeamMemberIndex !== index}
                  size="30"
                  style="inline"
                  value={member.lastName}
                  placeholder="Last name"
                  disabled={index > maxTeamMemberIndex}
                  on:input={({ detail: value }) => update_team_member_property('lastName', value, index)} />
              </td>
              <td>
                <PsTextInput
                  readonly={editingTeamMemberIndex !== index}
                  size="30"
                  style="inline"
                  value={member.email}
                  placeholder="Email address"
                  disabled={index > maxTeamMemberIndex}
                  on:input={({ detail: value }) => update_team_member_property('email', value, index)} />
              </td>
              <td>
                <PsDropdown
                  editable={editingTeamMemberIndex === index}
                  options={ROLES}
                  style="inline"
                  selected={member.role}
                  disabled={index > maxTeamMemberIndex}
                  on:change={({ detail: value }) => update_team_member_property('role', value, index)} />
              </td>
              <td>
                {#if editingTeamMemberIndex === index}
                  {#if member.toInvite || creatingNewTeamMember}
                    <PsButton
                      {loading}
                      style="secondary inline"
                      on:click={() => save_new_team_member(member)}
                      on:tween-out-complete={team_member_update_complete}>
                      Create
                    </PsButton>
                  {:else}
                    <PsButton
                      {loading}
                      style="secondary inline"
                      on:click={() => save_updated_team_member(member, index)}
                      on:tween-out-complete={team_member_update_complete}>
                      Save
                    </PsButton>
                  {/if}
                  /
                  <PsButton
                    disabled={loading || creatingNewTeamMember || updatingTeamMember}
                    style="secondary inline"
                    on:click={() => cancel_team_member_edit(index)}>
                    Cancel
                  </PsButton>
                {:else}
                  <PsButton
                    disabled={loading || creatingNewTeamMember || updatingTeamMember}
                    style="secondary inline"
                    on:click={() => edit_team_member(member, index)}>
                    Edit
                  </PsButton>
                  /
                  <PsButton
                    disabled={loading || creatingNewTeamMember || updatingTeamMember}
                    style="secondary inline"
                    on:click={() => remove_team_member(member)}>
                    Remove
                  </PsButton>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</main>

<style>
  .team-name {
    display: flex;
    align-items: baseline;
  }
  .team-name > :global(:not(:last-child)) {
    margin-right: 0.5rem;
  }

  .team-members {
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    overflow: hidden;
  }

  .team-members-table {
    overflow: auto;
    border: 1px solid rgba(42, 41, 41, 0.1);
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }
  table :global(*) {
    white-space: nowrap;
  }

  td,
  th {
    padding: 0.5rem;
    min-width: 10ch;
  }

  th {
    background-color: rgb(242, 241, 241);
    position: sticky;
    top: 0;
    /*
      The 'z-index: 1' is a hacky fix due the fact that we have
      PsButton components inside the table.
      They have 'position: relative', which puts them
      on their own rendering context layer. Add that to
      the fact that they are generated via JavaScript,
      they are placed on the DOM after the table elements are
      and thus, the browser renders them on top of the th element.
    */
    z-index: 1;
  }

  tr:nth-child(2n) {
    background-color: rgba(42, 41, 41, 0.025);
  }

  section > :global(:not(:last-child)) {
    margin-bottom: 0.5rem;
  }

  /* .entry {
    border-bottom: 1px solid rgba(42,41,41, 0.15);
    padding-bottom: 1rem;
  } */
</style>
