<script>
  import { createEventDispatcher } from 'svelte';
  import IconClose from '../components/icons/IconClose.svelte';

  export let hideCloseButton = false;

  const dispatch = createEventDispatcher();

  function close () {
    dispatch('close')
  };
</script>

<div
  class="wrapper"
>
  <div
    class="modal-box shadow"
  >
    <div
      class="modal-header"
    >
      <div>
        <slot name="header"></slot>
      </div>
      { #if !hideCloseButton }
        <button
          class="close"
          on:click={ close }
        >
          <IconClose />
        </button>
      { /if }
    </div>
    <slot></slot>
    <slot name="footer"></slot>
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
    z-index: 10;
  }

  .modal-box {
    background-color: white;
    padding: 2rem 4rem;
    border-radius: 1rem;
    max-width: 80%;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
  }

  .close {
    border: 0;
    background: transparent;
    transform: translate(3rem, -1rem);
    padding: 0;
  }
</style>