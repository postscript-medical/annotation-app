<script>
  import { onMount } from "svelte";
  import { user, organization } from "../stores.js";
  import loadOrganizations from "../methods/load-organizations.js";
  import netlifyFunction from "../methods/netlify-function";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";
  import Modal from "../modals/Modal.svelte";
  import ErrorMessage from "../components/ErrorMessage.svelte";

  let organizations;
  let confirmation = "";
  let selectedRow = "";
  let loading = false;
  let error = "";
  let saveComplete = false;

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
    error = "";
    loading = true;
    saveComplete = false;

    netlifyFunction("/.netlify/functions/delete-organization", $user, {
      body: {
        netlifyID: selectedOrganization.netlifyID,
        orgID: selectedOrganization.id,
        stripeID: selectedOrganization.stripeID,
      },
    })
      .then(() => {
        saveComplete = true;
      })
      .catch((err) => {
        error = err;
      })
      .finally(() => {
        loading = false;
      });
  }

  function loadData() {
    organizations = undefined;

    loadOrganizations($user)
      .then((response) => response.json())
      .then((payload) => {
        organizations = payload;
      });
  }

  function tweenOutComplete() {
    if (saveComplete) {
      handleModalClose();

      loadData();
    }
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
    <ul class="plain stacker--small">
      {#if organizations.data.length}
        {#each organizations.data as { owner, id }}
          <li class="card shadow">
            <p>
              {owner}
            </p>

            <PsButton
              disabled={$organization.email === owner}
              style="secondary"
              on:click={() => deleteOrganization(id)}
            >
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
    {loading}
    {disableConfirmButton}
    on:close={handleModalClose}
    on:confirm={handleModalConfirm}
    on:tween-out-complete={tweenOutComplete}
  >
    <svelte:fragment slot="header">
      Confirm organization deletion
    </svelte:fragment>

    {#if error}
      <ErrorMessage message={error} />
    {/if}

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
    padding: 1rem;
  }
</style>
