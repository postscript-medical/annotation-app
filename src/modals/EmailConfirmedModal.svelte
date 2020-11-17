<script>
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

</script>

<Modal
  confirmBtCopy="Ok"
  on:close
  on:confirm
>
    <span
      slot="header"
    >
      Thank you
    </span>
    <p>
      Your email is now confirmed. You can now log into your account.
    </p>
</Modal>

<style>
  p {
    margin-bottom: 2rem;
  }
</style>