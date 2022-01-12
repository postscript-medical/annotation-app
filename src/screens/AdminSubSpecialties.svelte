<script>
  import { onMount } from "svelte";
  import { user } from "../stores.js";
  import loadSpecialties from "../methods/load-specialties.js";
  import EditSubSpecialtyModal from "../modals/EditSubSpecialtyModal.svelte";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsHeader from "../components/PsHeader.svelte";

  let editCardIndex = null;
  let editCardData = null;
  let specialties;

  function addIllustration({ detail: illustration }) {
    const isDuplicate = editCardData.illustrations.find(
      ({ id }) => id === illustration.id
    );

    if (isDuplicate) return;

    editCardData.illustrations.push(illustration);

    editCardData = editCardData;
  }

  function editCard(index, srcData) {
    editCardIndex = index;

    if (srcData) {
      editCardData = JSON.parse(JSON.stringify(srcData));
    } else {
      editCardData = null;
    }
  }

  function editCardModalClose() {
    editCard(null, null);
  }

  function editCardModalOpen(index, srcData) {
    editCard(index, srcData);
  }

  function loadData() {
    specialties = null;

    loadSpecialties($user)
      .then((response) => {
        return response.json();
      })
      .then((payload) => {
        specialties = payload;
      });
  }

  function removeIllustration({ detail: index }) {
    editCardData.illustrations.splice(index, 1);

    editCardData = editCardData;
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
  <h1>Sub-specialty management</h1>

  <NavBar />

  {#if specialties}
    <ul class="specialties-list wrapper plain">
      {#each specialties.data as specialty}
        <li class="card stacker shadow">
          <p>
            <strong>
              {specialty.name}
            </strong>
          </p>

          <ul class="sub-specialty-list stacker plain">
            {#each specialty.subSpecialties as subSpecialty, index}
              <li>
                <PsButton
                  style="secondary"
                  on:click={() => editCardModalOpen(index, subSpecialty)}
                >
                  {subSpecialty.name}
                </PsButton>
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  {:else}
    <p>Loading data</p>
  {/if}

  {#if editCardData}
    <EditSubSpecialtyModal
      data={editCardData}
      on:add-illustration={addIllustration}
      on:close={editCardModalClose}
      on:save-complete={loadData}
      on:remove-illustration={removeIllustration}
    />
  {/if}
</main>

<style>
  .specialties-list {
    margin: 0;
    overflow-y: auto;
    padding: 0.25rem;
  }

  .card {
    border-radius: 0.25rem;
    padding: 1rem;
    flex-grow: 1;
  }
</style>
