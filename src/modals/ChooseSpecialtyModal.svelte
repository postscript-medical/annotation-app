<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import loadSpecialties from "../methods/load-specialties";

  export let user;
  export let orgId;

  const dispatch = createEventDispatcher();

  let promise;
  let specialtyId;

  async function load() {
    let response = await loadSpecialties(user);
    promise = await response.json();
  }

  async function saveChosenSpecialty() {
    dispatch("specialty-updated", { id: orgId, specialtyId });
  }

  load();
</script>

<Modal
  disableConfirmButton={!specialtyId}
  hideCancelButton
  hideCloseButton
  on:confirm={saveChosenSpecialty}
>
  <svelte:fragment slot="header">Choose your specialty</svelte:fragment>

  {#if promise && promise.data}
    {#each promise.data as specialty}
      <label>
        <input
          type="radio"
          name="specialty"
          value={specialty.id}
          bind:group={specialtyId}
        />
        {specialty.name}
      </label>
    {/each}
  {/if}
</Modal>
