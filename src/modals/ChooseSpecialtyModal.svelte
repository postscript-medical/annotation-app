<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import { specialties } from "../stores.js";

  export let user;
  export let orgId;

  const dispatch = createEventDispatcher();

  let specialtyId;

  async function saveChosenSpecialty() {
    dispatch("specialty-updated", { id: orgId, specialtyId });
  }
</script>

<Modal
  disableConfirmButton={!specialtyId}
  hideCancelButton
  hideCloseButton
  on:confirm={saveChosenSpecialty}
>
  <svelte:fragment slot="header">Welcome to PostScript</svelte:fragment>

  <p>Please choose your desired specialty:</p>

  {#if $specialties && $specialties.length > 0}
    <ul class="plain">
      {#each $specialties as specialty}
        <li>
          <input
            id={specialty.id}
            type="radio"
            name="specialty"
            value={specialty.id}
            bind:group={specialtyId}
          />
          <label for={specialty.id}>
            {specialty.name}
          </label>
        </li>
      {/each}
    </ul>
  {:else}
    <p>Loading specialties...</p>
  {/if}
</Modal>

<style>
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 0.25rem;
  }

  label {
    border: 2px solid black;
    border-radius: 0.5rem;
    display: block;
    padding: 0.5rem;
  }

  input[type="radio"]:checked + label,
  label:hover {
    border-color: rgb(55, 154, 70);
    background-color: rgb(55, 154, 70);
    color: white;
  }
</style>
