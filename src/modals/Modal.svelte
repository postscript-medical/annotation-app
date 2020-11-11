<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import IconClose from '../components/icons/IconClose.svelte';

  export let hideCloseButton = false;

  let wrapper;
  let modal

  const dispatch = createEventDispatcher();

  function close () {
    gsap.to([wrapper, modal], {
      duration: 0.15,
      opacity: 0,
      ease: 'none',
      onComplete: () => {
        dispatch('close')
      }
    })
  };

  onMount(() => {
    gsap
      .timeline()
      .from(wrapper, {
        duration: 0.075,
        ease: 'none',
        opacity: 0
      })
      .from(modal, {
        duration: 0.5,
        ease: 'circ.out',
        y: 50,
        opacity: 0,
      })
  });
</script>

<div
  bind:this={ wrapper }
  class="wrapper"
>
  <article
    bind:this={ modal }
    class="modal shadow"
  >
    <header
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
    </header>
    <slot></slot>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </article>
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

  .modal {
    background-color: white;
    padding: 2rem 2.5rem;
    border-radius: 1rem;
    max-width: 95%;
    max-height: 90%;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    margin: -1rem -1.75rem 1rem 0;
  }

  .close {
    border: 0;
    background: transparent;
    padding: 0;
  }

  @media screen and (min-width: 600px) {
    .modal {
      padding: 2rem 4rem;
      max-width: 80%;
    }

    .modal-header {
      margin: -1rem -3rem 1rem 0;
    }
  }
</style>