<script>
  import Modal from "./Modal.svelte";
</script>

<Modal cancelBtCopy="Close" hideConfirmButton on:close>
  <span slot="header"> Error</span>
  <slot />
</Modal>
