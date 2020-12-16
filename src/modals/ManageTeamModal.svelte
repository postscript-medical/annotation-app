<script>
  import { createEventDispatcher } from "svelte";
  import { ROLE_USER } from "../constants/defaults.js";
  import ErrorMessage from "../components/ErrorMessage.svelte";
  import PsModal from "./PsModal.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsDropdown from "../components/PsDropdown.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

  export let errorMessage = "";
  export let loading = false;
  export let members = [];
  export let maxTeamMembers = 1;
  export let teamName;

  const dispatch = createEventDispatcher();
  const ROLES = [ROLE_USER];

  let editingTeamMemberIndex = null;
  let editedTeamMemberSrc;
  let editedTeamNameSrc;
  let updatingTeamName = false;
  let updatingTeamMember = false;
  let creatingNewTeamMember = false;
  let teamMembersTable;

  $: totalTeamMembersAssigned = members.length;
  $: totalTeamMembersLeft = maxTeamMembers - totalTeamMembersAssigned;
  $: disabled =
    totalTeamMembersLeft < 1 || !!(typeof editingTeamMemberIndex === "number");
  $: maxTeamMemberIndex = maxTeamMembers - 1;

  function addTeamMember() {
    const newTeamMember = {
      email: "",
      firstName: "",
      lastName: "",
      role: ROLE_USER,
      toInvite: true,
    };

    editedTeamMemberSrc = newTeamMember;

    dispatch("update", {
      action: "add-new-team-member",
      teamMember: newTeamMember,
    });

    editingTeamMemberIndex = totalTeamMembersAssigned;

    /* Wait for the new row to be placed in the DOM */
    requestAnimationFrame(() => {
      const { height } = teamMembersTable.getBoundingClientRect();

      teamMembersTable.parentNode.scroll(0, height);
    });
  }

  function cancelTeamMemberEdit(index) {
    editingTeamMemberIndex = null;

    if (editedTeamMemberSrc.toInvite) {
      removeTeamMember(editedTeamMemberSrc);

      return;
    }

    updateTeamMember(editedTeamMemberSrc, index);
  }

  function editTeamMember(teamMember, index) {
    editedTeamMemberSrc = { ...teamMember };

    editingTeamMemberIndex = index;
  }

  function updateTeamMember(teamMember, index) {
    dispatch("update", { action: "update-team-member", teamMember, index });
  }

  async function removeTeamMember(teamMember) {
    dispatch("update", { action: "remove-team-member", teamMember });
  }

  async function saveNewTeamMember(teamMember) {
    creatingNewTeamMember = true;

    dispatch("update", { action: "save-new-team-member", teamMember });
  }

  async function saveUpdatedTeamMember(teamMember) {
    updatingTeamMember = true;

    dispatch("update", { action: "save-updated-team-member", teamMember });
  }

  function teamNameUpdateComplete() {
    updatingTeamName = false;

    if (!errorMessage) {
      editedTeamNameSrc = null;
    }
  }

  function toggleEditTeamName(teamName) {
    if (teamName) {
      editedTeamNameSrc = teamName;
    } else {
      updateTeamName(editedTeamNameSrc);

      editedTeamNameSrc = null;
    }
  }

  function updateTeamMemberProperty(key, value, index) {
    updateTeamMember({ ...members[index], [key]: value }, index);
  }

  function updateTeamName(name) {
    dispatch("update-team-name", name);
  }

  function saveUpdatedTeamName(teamName) {
    updatingTeamName = true;

    dispatch("update", { action: "save-updated-team-name", teamName });
  }

  function teamMemberUpdateComplete() {
    if (creatingNewTeamMember) creatingNewTeamMember = false;

    if (updatingTeamMember) updatingTeamMember = false;

    if (!errorMessage) editingTeamMemberIndex = null;
  }
</script>

<PsModal hideCancelButton hideConfirmButton on:close>
  <h2 slot="title">Edit team</h2>
  <ErrorMessage message={errorMessage} />

  <section class="entry">
    <h3>Team details</h3>
    <div class="team-name">
      <PsTextInput
        readonly={!editedTeamNameSrc}
        value={teamName}
        style="inline"
        on:input={({ detail: value }) => updateTeamName(value)}>
        Team name:
      </PsTextInput>
      {#if !!editedTeamNameSrc}
        <PsButton
          {loading}
          style="secondary inline"
          on:click={() => saveUpdatedTeamName(teamName)}
          on:tween-out-complete={teamNameUpdateComplete}>
          Save
        </PsButton>
        <PsButton
          disabled={loading || updatingTeamName}
          style="secondary inline"
          on:click={() => toggleEditTeamName()}>
          Cancel
        </PsButton>
      {:else}
        <PsButton
          disabled={loading}
          style="secondary inline"
          on:click={() => toggleEditTeamName(teamName)}>
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
          {#each members as member, index}
            <tr>
              <td>
                <PsTextInput
                  readonly={editingTeamMemberIndex !== index}
                  size="30"
                  style="inline"
                  value={member.firstName}
                  placeholder="First name"
                  disabled={index > maxTeamMemberIndex}
                  on:input={({ detail: value }) => updateTeamMemberProperty('firstName', value, index)} />
              </td>
              <td>
                <PsTextInput
                  readonly={editingTeamMemberIndex !== index}
                  size="30"
                  style="inline"
                  value={member.lastName}
                  placeholder="Last name"
                  disabled={index > maxTeamMemberIndex}
                  on:input={({ detail: value }) => updateTeamMemberProperty('lastName', value, index)} />
              </td>
              <td>
                <PsTextInput
                  readonly={editingTeamMemberIndex !== index}
                  size="30"
                  style="inline"
                  value={member.email}
                  placeholder="Email address"
                  disabled={index > maxTeamMemberIndex}
                  on:input={({ detail: value }) => updateTeamMemberProperty('email', value, index)} />
              </td>
              <td>
                <PsDropdown
                  editable={editingTeamMemberIndex === index}
                  options={ROLES}
                  style="inline"
                  selected={member.role}
                  disabled={index > maxTeamMemberIndex}
                  on:change={({ detail: value }) => updateTeamMemberProperty('role', value, index)} />
              </td>
              <td>
                {#if editingTeamMemberIndex === index}
                  {#if member.toInvite || creatingNewTeamMember}
                    <PsButton
                      {loading}
                      style="secondary inline"
                      on:click={() => saveNewTeamMember(member)}
                      on:tween-out-complete={teamMemberUpdateComplete}>
                      Create
                    </PsButton>
                  {:else}
                    <PsButton
                      {loading}
                      style="secondary inline"
                      on:click={() => saveUpdatedTeamMember(member, index)}
                      on:tween-out-complete={teamMemberUpdateComplete}>
                      Save
                    </PsButton>
                  {/if}
                  /
                  <PsButton
                    disabled={loading || creatingNewTeamMember || updatingTeamMember}
                    style="secondary inline"
                    on:click={() => cancelTeamMemberEdit(index)}>
                    Cancel
                  </PsButton>
                {:else}
                  <PsButton
                    disabled={loading || creatingNewTeamMember || updatingTeamMember}
                    style="secondary inline"
                    on:click={() => editTeamMember(member, index)}>
                    Edit
                  </PsButton>
                  /
                  <PsButton
                    disabled={loading || creatingNewTeamMember || updatingTeamMember}
                    style="secondary inline"
                    on:click={() => removeTeamMember(member)}>
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

  <div>
    <PsButton
      disabled={loading || disabled}
      style="tertiary"
      on:click={addTeamMember}>
      + Add user
    </PsButton>
  </div>
</PsModal>

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
