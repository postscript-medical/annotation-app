<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function confirm () {
    dispatch('confirm');
  };
</script>

<div class="wrapper">
  <div class="modal-box">
    <h2>
      Thank you
    </h2>
    <p>
      Your email is now confirmed. You can now log into your account.
    </p>

    <!-- svelte-ignore a11y-autofocus -->
    <button 
      autofocus
      on:click={ confirm }
    >
      Ok
    </button>
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
    box-shadow: 0px 0px .5rem 0px rgba(200,200,200,1);
    border-radius: 0.5rem;
  }

  p {
    margin-bottom: 2rem;
  }

  button {
    border: 2px solid black;
    background-color: white;
  }
</style>