<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const dispatch = createEventDispatcher();

  function confirm () {
    dispatch('confirm');
  };
</script>

<Modal>
    <h2>
      Thank you
    </h2>
    <p>
      Your email is now confirmed. You can now log into your account.
    </p>

    <PsButton 
      autofocus
      on:click={ confirm }
      style="secondary"
    >
      Ok
    </PsButton>
</Modal>

<style>
  p {
    margin-bottom: 2rem;
  }
</style>