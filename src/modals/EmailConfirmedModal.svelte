<script>
  import Modal from "./Modal.svelte";
</script>

<Modal cancelBtCopy="Close" hideConfirmButton on:close>
  <span slot="header"> Thank you </span>
  <p>Your email is now confirmed. You can now log into your account.</p>
</Modal>

<style>
  p {
    margin-bottom: 2rem;
  }
</style>
