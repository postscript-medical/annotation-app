<script>
  import { selectedIllustrationTitle } from '../stores.js';
  import PsLogo from './PsLogo.svelte';
  import ButtonShare from './ButtonShare.svelte';
  import UserSettingsDropdown from './UserSettingsDropdown.svelte';

  export let user;
  export let loggedIn = false;
  // TODO: once the subscription level is inside the user object, remove the below.
  export let hasPaymentDetails = false;
</script>

<header
  class="central-align"
  class:centered={ loggedIn }
>
  <div
    class="options"
  >
    <PsLogo
      showName={ !loggedIn }
      size={ loggedIn ? 'small' : 'large' }
    />
    { #if loggedIn && hasPaymentDetails }
      <span
        class="sub-speciality">
        |
      </span>
      <span
        class="sub-speciality">
        { $selectedIllustrationTitle }
      </span>
    { /if }
  </div>
  { #if user }
    <div
      class="options"
    >
      { #if hasPaymentDetails }
        <ButtonShare />
      { /if }
      <UserSettingsDropdown
        { user }
      />
    </div>
  { /if }
</header>

<style>
  header {
    position: absolute;
    top: 0;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: auto;
    max-height: none;
    padding: 1rem 1rem 0 1rem;
    pointer-events: none;
  }

  .centered {
    left: 50%;
    transform: translate(-50%, 0);
    max-width: none;
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