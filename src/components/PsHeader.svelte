<script>
  import { user } from '../stores.js';
  import PsLogo from './PsLogo.svelte';
  import ButtonShare from './ButtonShare.svelte';
  import ButtonUser from './ButtonUser.svelte';
</script>

<header>
  <PsLogo showName />
  { #if $user }
    <div class="options">
      <ButtonShare />
      <ButtonUser
        user={ $user }
      />
    </div>
  { /if }
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

  .options {
    display: flex;
    align-items: flex-end;
  }

  .options > :global(*:not(:last-child)) {
    margin-right: 1rem;
  }
</style>