<script>
  import { activeModal } from "../stores.js";
  import { MODAL_FEEDBACK } from "../constants/defaults";
  import PsButton from "./PsButton.svelte";

  function openFeedbackModal() {
    $activeModal = MODAL_FEEDBACK;
  }
</script>

<PsButton style="tertiary" on:click={openFeedbackModal}>Feedback?</PsButton>
