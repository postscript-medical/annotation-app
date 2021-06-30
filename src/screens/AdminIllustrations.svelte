<script>
  import { onDestroy, onMount } from "svelte";
  import { isLoading, user } from "../stores.js";
  import {
    ILLUSTRATION_ADMIN_THUMBNAIL_PATH,
    ILLUSTRATION_ADMIN_PREVIEW_PATH,
  } from "../constants/defaults";
  import IntersectionObserver from "../components/IntersectionObserver.svelte";
  import Modal from "../modals/Modal.svelte";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsButton from "../components/PsButton.svelte";
  import PsHeader from "../components/PsHeader.svelte";
  import PsTagsInput from "../components/PsTagsInput.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

  let editCardIndex = null;
  let editCardData = null;
  let error = false;
  let nativeLoading = false;
  let illustrations;

  // Determine whether to bypass the intersecting check
  if ("loading" in HTMLImageElement.prototype) {
    nativeLoading = true;
  }

  /*
   * This is hacky as hell but there is no current better alternative as far as I know currently
   * https://github.com/sveltejs/svelte/issues/3105
   */
  document.body.classList.add("manage-team");

  function editCard(index, srcData) {
    editCardIndex = index;
    editCardData = srcData ? { ...srcData } : null;
  }

  async function fetchIllustrations(params) {
    const token = $user ? await $user.jwt(true) : false;

    if (!token) {
      return Promise.reject(
        new Error("Could not validate your token. Please contact support.")
      );
    }

    const request = await fetch("/.netlify/functions/get-illustrations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...params }),
    }).catch((error) => {
      console.error("::: Error getting illustrations :::", error);
      error = true;
    });

    illustrations = await request.json();
  }

  function fetchMoreIllustrations(params) {
    illustrations = null;

    fetchIllustrations(params);
  }

  function editCardModalOpen(index, srcData) {
    editCard(index, srcData);
  }

  function editCardModalClose() {
    editCard(null, null);
  }

  async function saveChanges() {
    const token = $user ? await $user.jwt(true) : false;

    if (!token) {
      return Promise.reject(
        new Error("Could not validate your token. Please contact support.")
      );
    }

    $isLoading = true;

    const bodyPayload = {
      ...editCardData,
    };

    const request = await fetch(
      "/.netlify/functions/update-illustration-details",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      }
    ).catch((error) => {
      console.error("::: ERROR - Saving illustration changes :::", error);

      saveAttempted();
    });

    if (!request.ok) {
      saveAttempted();

      return;
    }

    saveAttempted(true);
  }

  function saveAttempted(success) {
    $isLoading = false;

    if (success) {
      updateIllustrationArray();

      editCardModalClose();
    }
  }

  function updateIllustrationArray() {
    const updatedArray = [...illustrations.data];
    updatedArray[editCardIndex] = editCardData;

    illustrations.data = updatedArray;

    // Because how Svelte's reactivity works
    // https://svelte.dev/tutorial/updating-arrays-and-objects
    illustrations = illustrations;
  }

  function updateCardData(key, value) {
    editCardData[key] = value;
  }

  onMount(() => {
    fetchIllustrations();
  });

  onDestroy(() => {
    document.body.classList.remove("manage-team");
  });
</script>

<div class="main-content central-align">
  <PsHeader user={$user} loggedIn hideButtons />

  <h1>Illustration management</h1>

  <NavBar />

  {#if illustrations}
    <ul class="illustration-list wrapper" role="list">
      {#each illustrations.data as illustration, index}
        <li class="card stacker shadow">
          <IntersectionObserver once let:intersecting>
            <!-- Need to create a dummy that holds the size/shape of the image prior to lazy loading to stop content shift -->
            <!-- This is not triggering on IE -->
            {#if nativeLoading || intersecting}
              <img
                src={`/${ILLUSTRATION_ADMIN_THUMBNAIL_PATH}${illustration.src}`}
                alt=""
              />
            {/if}
          </IntersectionObserver>

          <div class="illustration-card__details stacker--small">
            <p>Name: {illustration.name}</p>

            <p>Filename: {illustration.src}</p>

            <dl>
              <dt>Aliases:</dt>

              {#each illustration.alias as alias}
                <dd>
                  {alias}
                </dd>
              {/each}
            </dl>

            <div>
              <PsButton
                disabled={$isLoading}
                style="secondary"
                on:click={() => editCardModalOpen(index, illustration)}
              >
                Edit
              </PsButton>
            </div>
          </div>
        </li>
      {/each}
    </ul>

    <div class="navigation">
      {#if illustrations.before}
        <PsButton
          on:click={() =>
            fetchMoreIllustrations({ before: illustrations.before })}
        >
          Previous set
        </PsButton>
      {/if}

      {#if illustrations.after}
        <PsButton
          on:click={() =>
            fetchMoreIllustrations({ after: illustrations.after })}
        >
          Next set
        </PsButton>
      {/if}
    </div>
  {:else if error}
    <h2>Attention!</h2>

    <p>There was an error loading the data.</p>
  {:else}
    <p>Loading data</p>
  {/if}

  {#if editCardData}
    <Modal on:confirm={saveChanges} on:close={editCardModalClose}>
      <svelte:fragment slot="header">Edit illustration details</svelte:fragment>

      <div class="stacker">
        <!-- TODO: Add an image preview -->
        <img
          src={`/${ILLUSTRATION_ADMIN_PREVIEW_PATH}${editCardData.src}`}
          alt=""
          width="320"
          height="226"
          class="illustration-preview"
        />

        <p>Filename: {editCardData.src}</p>

        <PsTextInput
          value={editCardData.name}
          on:input={({ detail }) => updateCardData("name", detail)}
          style="inline"
        >
          Name:
        </PsTextInput>

        <div>
          <PsTagsInput
            tags={editCardData.alias}
            style="inline"
            on:input={({ detail }) => updateCardData("alias", detail)}
          >
            Aliases:
          </PsTagsInput>

          <p class="note">Separate each alias with a comma.</p>
        </div>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .main-content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  .illustration-list {
    overflow-y: auto;
    padding: 0.25rem;
  }

  .card {
    border-radius: 0.25rem;
    padding: 1rem;
    flex-grow: 1;
  }

  .card:not(:last-child) {
    border-bottom: 2px solid #f2f2f2;
  }

  .card :global(img) {
    width: auto;
    height: 8rem;
  }

  .illustration-card__details {
    justify-content: center;
  }

  .illustration-preview {
    margin-left: auto;
    margin-right: auto;
  }

  .navigation {
    display: flex;
    padding: 1rem;
    justify-content: space-between;
  }

  .navigation > :global(:last-child) {
    margin-left: auto;
  }
</style>
