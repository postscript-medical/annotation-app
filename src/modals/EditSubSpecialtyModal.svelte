<script>
  import { createEventDispatcher } from "svelte";
  import { isLoading, user } from "../stores.js";
  import debounce from "../methods/debouncer.js";
  import Modal from "./Modal.svelte";
  import PsButton from "../components/PsButton.svelte";

  export let data;

  const dispatch = createEventDispatcher();

  let currentIllustrationsList;
  let searchTerm;
  let serverResponse;
  let serverWaiting = false;

  function addIllustration(illustration) {
    dispatch("add-illustration", illustration);
  }

  function close() {
    searchTerm = null;
    serverResponse = null;

    dispatch("close");
  }

  async function fetchIllustrationsByName(name) {
    const token = $user ? await $user.jwt(true) : false;

    if (!token) {
      return Promise.reject(
        new Error("Could not validate your token. Please contact support.")
      );
    }

    if (!name)
      return Promise.resolve({
        data: false,
      });

    serverWaiting = true;

    const request = await fetch(
      "/.netlify/functions/get-illustrations-by-name",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ searchTerm: name }),
      }
    ).catch((error) => {
      console.error("::: Error getting illustrations :::", error);
      error = true;
    });

    if (request.ok) {
      const response = await request.json();

      return response;
    } else {
      throw new Error("::: Error parsing response :::", request);
    }
  }

  function handleKeyDown(code, illustration) {
    if (code === "Space") {
      addIllustration(illustration);

      searchTerm = illustration.name;

      const firstListedIllustration =
        currentIllustrationsList.querySelector("button");

      firstListedIllustration.focus();
    }
  }

  function removeIllustration(index) {
    dispatch("remove-illustration", index);
  }

  function saveAttempted(success) {
    $isLoading = false;

    if (success) {
      dispatch("save-complete");

      close();
    }
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
      ...data,
    };

    const request = await fetch(
      "/.netlify/functions/update-sub-specialty-details",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      }
    ).catch((error) => {
      console.error("::: ERROR - Saving SubSpecialty changes :::", error);

      saveAttempted();
    });

    if (!request.ok) {
      saveAttempted();

      return;
    }

    saveAttempted(true);
  }

  function searchForTerms(event) {
    debounce(() => {
      fetchIllustrationsByName(event.target.value).then((response) => {
        serverResponse = response;

        serverWaiting = false;
      });
    }, 250);
  }
</script>

<Modal on:confirm={saveChanges} on:close={close}>
  <svelte:fragment slot="header">Edit sub-specialty</svelte:fragment>

  <div class="form-wrapper stacker">
    <h3>Details</h3>

    <p>
      Name: {data.name}
    </p>

    <h3>Additional illustration search</h3>

    <div class="search-widget stacker">
      <input
        placeholder="Add further illustrations"
        type="search"
        bind:value={searchTerm}
        on:input={searchForTerms}
        on:focus={searchForTerms}
      />

      <ul class="search-widget__options plain">
        {#if serverWaiting}
          <li class="entry">Searching...</li>
        {:else if serverResponse && serverResponse.data}
          {#if serverResponse.data.length < 1}
            <li class="entry">No results found.</li>
          {:else}
            {#each serverResponse.data as illustration}
              <li>
                <button
                  type="button"
                  on:click={() => addIllustration(illustration)}
                  on:keydown={(event) =>
                    handleKeyDown(event.code, illustration)}
                >
                  {illustration.name}
                </button>
              </li>
            {/each}
          {/if}
        {:else}
          <li class="entry">Please enter an illustration title.</li>
        {/if}
      </ul>
    </div>

    <h3>Current illustrations</h3>

    <ul
      bind:this={currentIllustrationsList}
      class="current-illustrations stacker--small plain"
    >
      {#each data.illustrations as illustration, index}
        <li class="current-illustrations__entry">
          <span>
            {illustration.name}
          </span>
          <!-- TODO add a remove button to clear this entry -->
          <PsButton
            style="secondary"
            on:click={() => removeIllustration(index)}
          >
            Remove
          </PsButton>
        </li>
      {/each}
    </ul>
  </div>
</Modal>

<style>
  .form-wrapper {
    overflow: hidden;
  }

  .current-illustrations {
    margin: 0;
    overflow-y: auto;
    padding: 0;
  }

  .current-illustrations__entry {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .search-widget {
    position: relative;
  }

  .search-widget:focus-within .search-widget__options,
  .search-widget__options:hover {
    visibility: visible;
  }

  .search-widget__options {
    background-color: white;
    border: 1px solid rgba(41, 41, 42, 0.2);
    border-radius: 0.25em;
    position: absolute;
    margin: 0;
    max-height: 15em;
    overflow-y: auto;
    padding: 0;
    top: 2.4em;
    visibility: hidden;
    width: 100%;
    z-index: 1;
  }

  .search-widget__options > * {
    background-color: white;
    border: 0;
  }

  .search-widget__options > :nth-child(even) {
    background-color: rgba(41, 41, 42, 0.025);
  }

  .search-widget__options button:focus,
  .search-widget__options > *:hover {
    background-color: rgba(41, 41, 42, 0.1);
  }

  .search-widget__options button,
  .search-widget__options .entry {
    background-color: transparent;
    border: none;
    border-radius: 0;
    padding: 0.75em;
    text-align: left;
    width: 100%;
  }
</style>
