<script>
  import { View } from "svench";
  import PsModal from "./PsModal.svelte";
  import PsButton from "../components/PsButton.svelte";

  const BUTTON_COPY = "Open modal";
  const DEFAULT = "Default";

  let modalToOpen = "";

  function confirmAction(modalName) {
    closeModal();
  }

  function openModal(modalName) {
    modalToOpen = modalName;
  }

  function closeModal() {
    modalToOpen = "";
  }
</script>

<View name={DEFAULT + "- with content"}>
  <div class="modal-container">
    <PsButton on:click={() => openModal(DEFAULT)}>{BUTTON_COPY}</PsButton>
    {#if modalToOpen === DEFAULT}
      <PsModal on:close={closeModal} on:confirm={() => confirmAction(DEFAULT)}>
        <span slot="header"> Header </span>

        <div>Content area</div>
      </PsModal>
    {/if}
  </div>
</View>

<style>
  .modal-container {
    min-width: 40rem;
    min-height: 30rem;
    display: block;
    justify-content: center;
    align-items: center;
    transform: translate(0, 0);
    width: 100%;
  }
</style>
