<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import PsButton from "../components/PsButton.svelte";

  const dispatch = createEventDispatcher();

  function confirm() {
    dispatch("close");
  }
</script>

<Modal on:close>
  <span slot="header"> Attention </span>

  <slot />

  <PsButton on:click={confirm}>Ok</PsButton>
</Modal>
