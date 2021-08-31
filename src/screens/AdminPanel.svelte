<script>
  import { onDestroy, onMount } from "svelte";
  import { isLoading, user } from "../stores.js";
  import { ILLUSTRATION_THUMBNAIL_PATH } from "../constants/defaults";
  import PsButton from "../components/PsButton.svelte";
  import PsTagsInput from "../components/PsTagsInput.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";
  import IntersectionObserver from "../components/IntersectionObserver.svelte";
  import ImagesGridThumbnail from "../components/ImagesGridThumbnail.svelte";

  let promise = fetchIllustrations($user);
  let response;
  let nativeLoading = false;
  let editCardIndex = null;
  let editCardData = {};
  let isSavingCard = false;

  $isLoading = false;

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
    if (editCardIndex !== null) {
      const updatedArray = [...response.data];
      const indexToUpdate = updatedArray.findIndex(
        (obj) => obj.data.src === editCardData.src
      );

      if (indexToUpdate >= 0) {
        updatedArray[indexToUpdate].data = editCardData;

        updateIllustrationArray(updatedArray);
      }
    }

    // TODO: jump focus to the card's first input
    editCardIndex = index;
    editCardData = { ...srcData };
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
    });

    const payload = await request.json();

    response = payload;

    return payload;
  }

  function fetchMoreIllustrations(params) {
    promise = fetchIllustrations(params);
  }

  async function saveChanges(index) {
    const token = $user ? await $user.jwt(true) : false;

    if (!token) {
      return Promise.reject(
        new Error("Could not validate your token. Please contact support.")
      );
    }

    isSavingCard = true;

    const illustration = response.data[index];

    const request = await fetch(
      "/.netlify/functions/update-illustration-details",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(illustration),
      }
    ).catch((error) => {
      console.error("::: ERROR - Saving illustration changes :::", error);

      saveComplete(index);
    });

    if (!request.ok) {
      saveComplete(index);

      return;
    }

    saveComplete();
  }

  function saveComplete(index) {
    isSavingCard = false;

    if (index) {
      editCard(index, editCardData);
    }

    editCardData = {};
  }

  function tweenOutComplete() {
    editCard(null, null);
  }

  function updateIllustrationArray(newArray) {
    response.data = newArray;

    // Because how Svelte's reactivity works
    // https://svelte.dev/tutorial/updating-arrays-and-objects
    response = response;
  }

  function updateTags(key, value) {
    const updatedArray = [...response.data];
    const index = updatedArray.findIndex((obj) => obj.data.src === key);
    const updatedEntry = { ...updatedArray[index] };
    updatedEntry.data.alias = value;

    updatedArray.splice(index, 1, updatedEntry);

    updateIllustrationArray(updatedArray);
  }

  onDestroy(() => {
    document.body.classList.remove("manage-team");
  });
</script>

<main class="main-content central-align">
  <h1>Illustration management</h1>

  {#await promise}
    <p>Loading data</p>
  {:then { data, before, after }}
    {#if data}
      <ul role="list" class="illustration-list">
        {#each data as illustration, index}
          <li class="illustration-card">
            <IntersectionObserver once let:intersecting>
              <!-- Need to create a dummy that holds the size/shape of the image prior to lazy loading to stop content shift -->
              <!-- This is not triggering on IE -->
              {#if nativeLoading || intersecting}
                <ImagesGridThumbnail
                  src={`/${ILLUSTRATION_THUMBNAIL_PATH}${illustration.data.src}`}
                  alt="" />
              {/if}
            </IntersectionObserver>

            <div class="illustration-card__details stacker--small">
              <PsTextInput
                value={illustration.data.name}
                style="inline"
                readonly={editCardIndex !== index}>
                Name:
              </PsTextInput>

              <p>Filename: {illustration.data.src}</p>

              <div>
                <ul role="list">
                  <PsTagsInput
                    placeholder="None"
                    tags={illustration.data.alias}
                    style="inline"
                    readonly={editCardIndex !== index}
                    on:input={({ detail }) => updateTags(illustration.data.src, detail)}>
                    Aliases:
                  </PsTagsInput>
                </ul>

                <p class="note">Separate each alias with a comma.</p>
              </div>

              <div>
                {#if editCardIndex === index}
                  <PsButton
                    loading={isSavingCard}
                    style="secondary"
                    on:click={() => saveChanges(index, illustration.data)}
                    on:tween-out-complete={tweenOutComplete}>
                    Save
                  </PsButton>

                  <PsButton
                    disabled={isSavingCard}
                    style="secondary"
                    on:click={() => editCard(null, null)}>
                    Cancel
                  </PsButton>
                {:else}
                  <PsButton
                    disabled={isSavingCard}
                    style="secondary"
                    on:click={() => editCard(index, illustration.data)}>
                    Edit
                  </PsButton>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="navigation">
      {#if before}
        <PsButton on:click={() => fetchMoreIllustrations({ before: before })}>
          Previous set
        </PsButton>
      {/if}

      {#if after}
        <PsButton
          class="next"
          on:click={() => fetchMoreIllustrations({ after: after })}>
          Next set
        </PsButton>
      {/if}
    </div>
  {:catch}
    <h2>Attention!</h2>

    <p>There was an error loading the data.</p>
  {/await}
</main>

<style>
  main {
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
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .illustration-card {
    display: flex;
    padding: 1rem;
    gap: 1rem;
  }

  .illustration-card:not(:last-child) {
    border-bottom: 2px solid #f2f2f2;
  }

  .illustration-card :global(img) {
    width: auto;
    height: 8rem;
  }

  .illustration-card__details {
    justify-content: center;
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
