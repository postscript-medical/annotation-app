<script>
  import { onDestroy, onMount } from "svelte";
  import { user } from "../stores.js";
  import loadSpecialties from "../methods/load-specialties.js";
  import EditSubSpecialtyModal from "../modals/EditSubSpecialtyModal.svelte";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsButton from "../components/PsButton.svelte";

  let editCardIndex = null;
  let editCardData = null;
  let specialties;

  /*
   * This is hacky as hell but there is no current better alternative as far as I know currently
   * https://github.com/sveltejs/svelte/issues/3105
   */
  document.body.classList.add("manage-team");

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

  onDestroy(() => {
    document.body.classList.remove("manage-team");
  });
</script>

<main class="main-content central-align">
  <h1>Sub-specialty management</h1>

  <NavBar />

  {#if specialties}
    <ul class="specialties-list wrapper" role="list">
      {#each specialties.data as specialty}
        <li class="card stacker shadow">
          <p>
            <strong>
              {specialty.name}
            </strong>
          </p>

          <ul class="sub-specialty-list stacker" role="list">
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
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

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
