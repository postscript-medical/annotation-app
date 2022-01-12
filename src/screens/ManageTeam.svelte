<script>
  /* TODO: Remove the call to get-protected-content from this screen */
  import { onMount } from "svelte";
  import { ROLE_OWNER, ROLE_USER } from "../constants/defaults.js";
  import { session, user } from "../stores.js";
  import loadManagementData from "../methods/load-management-data.js";
  import netlifyFunction from "../methods/netlify-function.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";
  import PsHeader from "../components/PsHeader.svelte";
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
  let maxTeamMembers = 1;
  let organization;
  let teamMembers = [];
  let teamMembersTable;
  let teamName = "";
  let teamId;

  $: totalTeamMembersAssigned = teamMembers.length;
  $: totalTeamMembersLeft = maxTeamMembers - totalTeamMembersAssigned;
  $: disabled =
    totalTeamMembersLeft < 1 || !!(typeof editingTeamMemberIndex === "number");
  $: maxTeamMemberIndex = maxTeamMembers - 1;

  function add_team_member() {
    const newTeamMember = {
      email: "",
      firstName: "",
      id: 0,
      lastName: "",
      role: ROLE_USER,
      toInvite: true,
    };

    editedTeamMemberSrc = newTeamMember;

    teamMembers = [{ ...newTeamMember }, ...teamMembers];

    editingTeamMemberIndex = 0;
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

  function is_remove_disabled({ email }) {
    if (!$user) return true;

    return (
      loading ||
      creatingNewTeamMember ||
      updatingTeamMember ||
      email === $user.email
    );
  }

  function loadPageData() {
    loadManagementData($user)
      .then((response) => {
        return response.json();
      })
      .then(({ organization, allMembers, team }) => {
        maxTeamMembers = organization.maxUsers;
        organization = organization;
        teamMembers = allMembers.data;
        teamName = team.name;
        teamId = team.id;
      });
  }

  async function remove_team_member(teamMember) {
    const { netlifyID, id: userID } = teamMember;

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

    teamMembers = [...teamMembers.filter(({ id }) => id !== userID)];
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
          organizationID: organization.id,
          password: "123" /* TODO: generate a random password */,
          role,
          teamID: teamId,
        },
      }
    ).catch((err) => {
      errorMessage = err.message;

      return;
    });

    if (!response) return;

    /**
     * Send welcome email with a reset password link to the newly created user.
     */
    send_email(email, firstName);

    /**
     * Reload the data
     */
    loadPageData();
  }

  async function save_team_change(url, params) {
    loading = true;

    clear_errors();

    const response = await netlifyFunction(url, $user, params).catch((err) => {
      loading = false;

      return Promise.reject(new Error(err.message));
    });

    loading = false;

    return response;
  }

  async function save_updated_team_member({
    email,
    firstName,
    id: userID,
    lastName,
    role,
  }) {
    updatingTeamMember = true;

    save_team_change("/.netlify/functions/update-team-member", {
      body: {
        email,
        firstName,
        lastName,
        role,
        userID,
      },
    }).catch((err) => (errorMessage = err.message));
  }

  function save_updated_team_name() {
    updatingTeamName = true;

    save_team_change("/.netlify/functions/update-team-properties", {
      body: {
        name: teamName,
        id: teamId,
      },
    }).catch((err) => {
      errorMessage = err.message;
    });
  }

  async function send_email(email, firstName) {
    await emailjs.send("5609467", "team_member_welcome", {
      from_email: $user.email,
      from_name: $user.user_metadata.full_name || "Admininstrator",
      org_name: organization.name,
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

  function toggle_edit_team_name(name) {
    if (name) {
      editedTeamNameSrc = name;
    } else {
      update_team_name(editedTeamNameSrc);

      editedTeamNameSrc = null;
    }
  }

  function update_team_member_property(key, value, index) {
    update_team_member({ ...teamMembers[index], [key]: value });
  }

  function update_team_member(teamMember) {
    const updatedTemMembers = [...teamMembers];

    const index = updatedTemMembers.findIndex(({ id }) => id === teamMember.id);

    updatedTemMembers.splice(index, 1, teamMember);

    teamMembers = updatedTemMembers;
  }

  function update_team_name(name) {
    teamName = name;
  }

  onMount(() => {
    loadPageData();
  });
</script>

<svelte:head>
  <style>
    body.ps-app {
      background-color: rgb(250, 250, 250);
    }
  </style>
</svelte:head>

<PsHeader user={$user} loggedIn hideButtons />

<main class="main-content central-align">
  <h1>Edit team</h1>

  <ErrorMessage message={errorMessage} />

  <section class="entry">
    <header>
      <h2>Team details</h2>
    </header>

    <div class="team-name">
      <PsTextInput
        disabled={loading || updatingTeamName}
        readonly={!editedTeamNameSrc}
        value={teamName}
        style="inline"
        on:input={({ detail: value }) => update_team_name(value)}
      >
        Team name:
      </PsTextInput>

      {#if !!editedTeamNameSrc}
        <PsButton
          {loading}
          style="secondary inline"
          on:click={save_updated_team_name}
          on:tween-out-complete={team_name_update_complete}
        >
          Save
        </PsButton>

        <PsButton
          disabled={loading || updatingTeamName}
          style="secondary inline"
          on:click={() => toggle_edit_team_name()}
        >
          Cancel
        </PsButton>
      {:else}
        <PsButton
          disabled={loading}
          style="secondary inline"
          on:click={() => toggle_edit_team_name(teamName)}
        >
          Edit
        </PsButton>
      {/if}
    </div>

    <PsTextInput
      readonly
      value={`${totalTeamMembersLeft} of ${maxTeamMembers} user slots used`}
      style="inline"
    >
      Usage:
    </PsTextInput>
  </section>

  <section class="team-members">
    <header>
      <h2>Team members</h2>

      <PsButton
        disabled={loading || disabled}
        style="tertiary"
        on:click={add_team_member}
      >
        + add
      </PsButton>
    </header>

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
            {#if member.role !== ROLE_OWNER}
              <tr>
                <td>
                  <PsTextInput
                    readonly={editingTeamMemberIndex !== index}
                    size="30"
                    style="inline"
                    value={member.firstName}
                    placeholder="First name"
                    disabled={index > maxTeamMemberIndex}
                    on:input={({ detail: value }) =>
                      update_team_member_property("firstName", value, index)}
                  />
                </td>
                <td>
                  <PsTextInput
                    readonly={editingTeamMemberIndex !== index}
                    size="30"
                    style="inline"
                    value={member.lastName}
                    placeholder="Last name"
                    disabled={index > maxTeamMemberIndex}
                    on:input={({ detail: value }) =>
                      update_team_member_property("lastName", value, index)}
                  />
                </td>
                <td>
                  <PsTextInput
                    readonly={editingTeamMemberIndex !== index}
                    size="30"
                    style="inline"
                    value={member.email}
                    placeholder="Email address"
                    disabled={index > maxTeamMemberIndex}
                    on:input={({ detail: value }) =>
                      update_team_member_property("email", value, index)}
                  />
                </td>
                <td>
                  <PsDropdown
                    editable={editingTeamMemberIndex === index}
                    options={ROLES}
                    style="inline"
                    selected={member.role}
                    disabled={index > maxTeamMemberIndex}
                    on:change={({ detail: value }) =>
                      update_team_member_property("role", value, index)}
                  />
                </td>
                <td>
                  {#if editingTeamMemberIndex === index}
                    {#if member.toInvite || creatingNewTeamMember}
                      <PsButton
                        {loading}
                        style="secondary inline"
                        on:click={() => save_new_team_member(member)}
                        on:tween-out-complete={team_member_update_complete}
                      >
                        Create
                      </PsButton>
                    {:else}
                      <PsButton
                        {loading}
                        style="secondary inline"
                        on:click={() => save_updated_team_member(member, index)}
                        on:tween-out-complete={team_member_update_complete}
                      >
                        Save
                      </PsButton>
                    {/if}
                    /
                    <PsButton
                      disabled={loading ||
                        creatingNewTeamMember ||
                        updatingTeamMember}
                      style="secondary inline"
                      on:click={() => cancel_team_member_edit(index)}
                    >
                      Cancel
                    </PsButton>
                  {:else}
                    <PsButton
                      disabled={loading ||
                        creatingNewTeamMember ||
                        updatingTeamMember}
                      style="secondary inline"
                      on:click={() => edit_team_member(member, index)}
                    >
                      Edit
                    </PsButton>
                    /
                    <PsButton
                      disabled={() => is_remove_disabled(member)}
                      style="secondary inline"
                      on:click={() => remove_team_member(member)}
                    >
                      Remove
                    </PsButton>
                  {/if}
                </td>
              </tr>
            {/if}
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

  .team-members header {
    display: flex;
    justify-content: space-between;
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
</style>
