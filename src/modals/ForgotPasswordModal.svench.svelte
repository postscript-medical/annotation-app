<script>
  import { View } from "svench";
  import Modal from "./Modal.svelte";
  import PsButton from "../components/PsButton.svelte";
  import ForgotPasswordModal from "./ForgotPasswordModal.svelte";

  const BUTTON_COPY = "Open modal";
  const DEFAULT = "Default";

  let modalToOpen = "";
  let loading = false;
  let emailSent = false;

  function openModal(modalName) {
    emailSent = false;
    modalToOpen = modalName;
  }

  function closeModal() {
    modalToOpen = "";
  }

  function requestResetPassword({ detail: email }) {
    loading = true;

    setTimeout(() => {
      loading = false;
      emailSent = true;
    }, 1666);
  }
</script>

<View name={DEFAULT}>
  <div class="modal-container">
    <PsButton on:click={() => openModal(DEFAULT)}>{BUTTON_COPY}</PsButton>
    {#if modalToOpen === DEFAULT}
      <ForgotPasswordModal
        {loading}
        {emailSent}
        on:close={closeModal}
        on:request-reset-password={requestResetPassword} />
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
