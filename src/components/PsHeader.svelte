<script>
  import { user } from '../stores.js';
  import LogOutButton from './LogOutButton.svelte';
  import PsLogo from './PsLogo.svelte';
  import ToolButton from './sketchpad/ToolButton.svelte';

  export let loggedIn = false;

  function clicked () {
    console.log('clicked');
  };
</script>

<header
  class:logged-in={ loggedIn }
>
  <PsLogo />
  <LogOutButton />
  { #if $user }
    <ToolButton
      on:click={ clicked }
    >
      { $user.email[0].toUpperCase() }
    </ToolButton>
  { /if }
</header>

<style>
  header {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    padding: 2rem 2rem 0 2rem;
  }
</style>