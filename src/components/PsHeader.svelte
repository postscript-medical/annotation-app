<script>
  import PsLogo from './PsLogo.svelte';
  import ButtonUser from './ButtonUser.svelte';
</script>

<header>
  <PsLogo />
  <ButtonUser />
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