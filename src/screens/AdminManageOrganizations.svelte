<script>
  import { onMount } from "svelte";
  import { user } from "../stores.js";
  import loadOrganizations from "../methods/load-organizations.js";
  import netlifyFunction from "../methods/netlify-function";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";
  import Modal from "../modals/Modal.svelte";

  let organizations;
  let confirmation = "";
  let selectedRow = "";

  $: disableConfirmButton =
    selectedOrganization && selectedOrganization.owner !== confirmation;
  $: selectedOrganization =
    organizations && organizations.data.find(({ id }) => id === selectedRow);

  function deleteOrganization(id) {
    selectedRow = id;
  }

  function handleModalClose() {
    selectedRow = "";
    confirmation = "";
  }

  async function handleModalConfirm() {
    /**
     * NOTE: This call ALWAYS fails when in localhost!
     */
    const response = await netlifyFunction(
      "/.netlify/functions/delete-organization",
      $user,
      {
        body: {
          netlifyID: selectedOrganization.netlifyID,
          orgID: selectedOrganization.id,
          stripeID: selectedOrganization.stripeID,
        },
      }
    );

    handleModalClose();

    loadData();
  }

  function loadData() {
    organizations = undefined;

    loadOrganizations($user)
      .then((response) => response.json())
      .then((payload) => {
        organizations = payload;
      });
  }

  onMount(() => {
    loadData();
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

<main class="ui-content central-align">
  <h1>Manage organizations</h1>

  <NavBar />

  {#if organizations}
    <ul class="plain">
      {#if organizations.data.length}
        {#each organizations.data as { owner, id }}
          <li>
            <p>
              {owner}
            </p>

            <PsButton style="secondary" on:click={() => deleteOrganization(id)}>
              Delete
            </PsButton>
          </li>
        {/each}
      {:else}
        <li>
          <p>No organizations to manage</p>
        </li>
      {/if}
    </ul>
  {:else}
    <p>Loading data</p>
  {/if}
</main>

{#if selectedOrganization}
  <Modal
    {disableConfirmButton}
    on:close={handleModalClose}
    on:confirm={handleModalConfirm}
  >
    <span slot="header"> Confirm organization delete </span>

    <p>Warning this action is irreversibe!</p>

    <p>Type the organization email below to confirm your choice.</p>

    <p>
      {selectedOrganization.owner}
    </p>

    <PsTextInput
      value={confirmation}
      on:input={({ detail }) => (confirmation = detail)}
    />
  </Modal>
{/if}

<style>
  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
</style>
