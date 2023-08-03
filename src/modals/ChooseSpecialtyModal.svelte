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
  <svelte:fragment slot="header">Welcome to PostScript</svelte:fragment>

  <p>Please choose your desired specialty:</p>

  {#if promise && promise.data}
    <ul class="plain">
      {#each promise.data as specialty}
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
