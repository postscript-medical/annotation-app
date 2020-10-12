<script>
  import { createEventDispatcher } from 'svelte';
  import PsButton from './PsButton.svelte';

  const dispatch = createEventDispatcher();

  function confirm () {
    dispatch('confirm');
  };
</script>

<div
  class="wrapper"
>
  <div
    class="modal-box shadow"
  >
    <h2>
      Thank you
    </h2>
    <p>
      Your email is now confirmed. You can now log into your account.
    </p>

    <PsButton 
      autofocus
      on:click={ confirm }
      type="secondary"
    >
      Ok
    </PsButton>
  </div>
</div>

<style>
  .wrapper {
    align-items: center;
    background-color: rgba(255,255,255,0.96);
    display: flex;
    justify-content: center;
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
  }

  .modal-box {
    background-color: white;
    padding: 4rem 8rem;
    border-radius: 0.5rem;
  }

  p {
    margin-bottom: 2rem;
  }
</style>