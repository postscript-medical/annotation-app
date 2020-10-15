<script>
  import { selectedImageTitle } from '../stores.js';
  import PsLogo from './PsLogo.svelte';
  import ButtonShare from './ButtonShare.svelte';
  import ButtonUser from './ButtonUser.svelte';

  export let user;
  export let loggedIn = false;
</script>

<header>
  <div
    class="options"
  >
    <PsLogo
      showName={ !loggedIn }
      size={ loggedIn ? 'small' : 'large' }
    />
    { #if loggedIn}
      <span
        class="sub-speciality">
        |
      </span>
      <span
        class="sub-speciality">
        { $selectedImageTitle }
      </span>
    { /if }
  </div>
  { #if user }
    <div
      class="options"
    >
      <ButtonShare />
      <ButtonUser
        { user }
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

  .sub-speciality {
    line-height: 1.5;
    padding-bottom: 0.25rem
  }
</style>