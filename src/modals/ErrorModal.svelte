<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const dispatch = createEventDispatcher();

  function confirm () {
    dispatch('close');
  };

</script>

<Modal
  on:close
>
  <h2
    slot="header"
  >
    Attention
  </h2>

  <slot></slot>

  <PsButton 
    autofocus
    on:click={ confirm }
  >
    Ok
  </PsButton>
</Modal>