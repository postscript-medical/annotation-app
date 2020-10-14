<script>
  import PsLogo from './PsLogo.svelte';
  import ButtonUser from './ButtonUser.svelte';
</script>

<header>
  <PsLogo showName />
  <ButtonUser />
</header>

<style>
  header {
    position: fixed;
    left: 45%;
    top: 0;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    padding: 3rem 3rem 0 3rem;
    max-width: 100ch;
    transform: translate(-45%, 0);
  }
</style>