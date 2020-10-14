<script>
  import { openDrawer, customerPortalUrl } from '../stores.js';
  import LogOutButton from './LogOutButton.svelte';
  import ButtonIcon from './sketchpad/ButtonIcon.svelte';
  import ManageSubscription from './ManageSubscription.svelte';

  export let user;

  function clicked () {
    $openDrawer = !$openDrawer;
  };
</script>

<div
  class="wrapper"
>
  <ButtonIcon
      onDark
      on:click={ clicked }
    >
      { user.email[0].toUpperCase() }
  </ButtonIcon>
  { #if $openDrawer }
    <div
      class="drawer shadow"
    >
      <ManageSubscription
        href={ $customerPortalUrl }
      />
      <LogOutButton
        inline
      />
    </div>
  { /if }
</div>

<style>
  .wrapper {
    position: relative;
  }

  .drawer {
    position: absolute;
    right: 0;
    top: 115%;
    background-color: white;
    padding: 2rem;
    border-radius: 0.5rem;
    min-width: 30ch;
    display: flex;
    flex-direction: column;
  }

  .drawer > :global(*:not(:last-child)) {
    margin-bottom: 1rem;
  }
</style>