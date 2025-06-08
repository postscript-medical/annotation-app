<script>
  import { activeModal } from "../stores.js";
  import { MODAL_SHARE } from "../constants/defaults";
  import PsButton from "./PsButton.svelte";

  function openShareModal() {
    $activeModal = MODAL_SHARE;
  }
</script>

<PsButton style="tertiary" on:click={openShareModal}>Share annotation</PsButton>
