<script>
  import PsLogo from './PsLogo.svelte';

  export let loggedIn = false;
</script>

<header
  class:logged-in={ loggedIn }
>
  <PsLogo />
</header>

<style>
  header {
    position: fixed;
    left: 0;
    transform: translate3d(8rem, 4rem, 0);
    top: 0;
    z-index: 1;
  }
  header.logged-in {
    transform: translate3d(2rem, 2rem, 0) scale(0.75);
  }
</style>