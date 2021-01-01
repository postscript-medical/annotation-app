<script>
  import { View } from "svench";
  import PsButton from "../components/PsButton.svelte";
  import EmailConfirmedModal from "./EmailConfirmedModal.svelte";

  const BUTTON_COPY = "Open modal";
  const DEFAULT = "Default";

  let modalToOpen = "";

  function openModal(modalName) {
    modalToOpen = modalName;
  }

  function closeModal() {
    modalToOpen = "";
  }
</script>

<View name={DEFAULT}>
  <div class="modal-container">
    <PsButton on:click={() => openModal(DEFAULT)}>{BUTTON_COPY}</PsButton>
    {#if modalToOpen === DEFAULT}
      <EmailConfirmedModal on:close={closeModal} on:confirm={closeModal} />
    {/if}
  </div>
</View>

<style>
  .modal-container {
    min-width: 40rem;
    min-height: 30rem;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: translate(0, 0);
  }
</style>
