<script>
  import { View } from "svench";
  import Modal from "./Modal.svelte";
  import PsButton from "../components/PsButton.svelte";

  const BUTTON_COPY = "Open modal";
  const DEFAULT = "Default";
  const LONG_HEADER_TITLE = "Long header title";

  let modalToOpen = "";

  function confirmAction(modalName) {
    console.log("Confirmed:", modalName);
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
      <Modal on:close={closeModal} on:confirm={() => confirmAction(DEFAULT)}>
        <span slot="header"> Header </span>

        <div>Content area</div>
      </Modal>
    {/if}
  </div>
</View>

<View name={LONG_HEADER_TITLE}>
  <div class="modal-container">
    <PsButton on:click={() => openModal(LONG_HEADER_TITLE)}>
      {BUTTON_COPY}
    </PsButton>
    {#if modalToOpen === LONG_HEADER_TITLE}
      <Modal on:close={closeModal} on:confirm={closeModal}>
        <span slot="header">
          I have a very very vey long header title with plenty of words
        </span>

        <div>Content area</div>
      </Modal>
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
