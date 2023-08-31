<script>
  import { activeModal, illustrationDisplayed } from "../stores.js";
  import { MODAL_SHARE } from "../constants/defaults";
  import PsButton from "./PsButton.svelte";

  function openShareModal() {
    $activeModal = MODAL_SHARE;
  }
</script>

<PsButton
  style="tertiary"
  on:click={openShareModal}
  disabled={!$illustrationDisplayed}>Share annotation</PsButton
>
