<script>
  import { View } from "svench";
  import PsButton from "../components/PsButton.svelte";
  import ResetPasswordModal from "./ResetPasswordModal.svelte";
  import checkPasswordRequirements from "../methods/check-password-requirements.js";

  const BUTTON_COPY = "Open modal";
  const DEFAULT = "Default";

  let modalToOpen = "";
  let loading = false;
  let errorMessage = "";

  function openModal(modalName) {
    modalToOpen = modalName;
  }

  function closeModal() {
    modalToOpen = "";
  }

  function clearErrors() {
    errorMessage = "";
  }

  function resetUserPassword({ detail: password }) {
    const isPasswordGood = checkPasswordRequirements(password);

    if (!isPasswordGood) {
      errorMessage = "Password does not meet criteria.";

      return;
    }

    loading = true;

    setTimeout(() => {
      loading = false;
    }, 1666);
  }
</script>

<View name={DEFAULT}>
  <div class="modal-container">
    <PsButton on:click={() => openModal(DEFAULT)}>{BUTTON_COPY}</PsButton>
    {#if modalToOpen === DEFAULT}
      <ResetPasswordModal
        {errorMessage}
        {loading}
        on:clear-errors={clearErrors}
        on:close={closeModal}
        on:reset-password={resetUserPassword}
      />
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
