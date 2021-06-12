<script>
  import { showFeedbackModal } from "../stores.js";
  import PsButton from "./PsButton.svelte";

  function handle_click() {
    $showFeedbackModal = !$showFeedbackModal;
  }
</script>

<PsButton style="tertiary" on:click={handle_click}>Feedback?</PsButton>
