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
        duration: 0.15,
        ease: 'none',
        opacity: 0
      })
      .from(modal, {
        duration: 0.25,
        ease: 'circ.Out',
        y: 50,
        opacity: 0,
      }, '-=0.075')
  });
</script>

<div
  bind:this={ wrapper }
  class="wrapper"
>
  <div
    bind:this={ modal }
    class="modal shadow"
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

  .modal {
    background-color: white;
    padding: 1rem;
    border-radius: 1rem;
    max-width: 95%;
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

  @media screen and (min-width: 600px) {
    .modal {
      padding: 2rem 4rem;
      max-width: 80%;
    }
  }
</style>