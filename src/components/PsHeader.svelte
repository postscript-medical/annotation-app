<script>
  import PsLogo from "./PsLogo.svelte";
  import ButtonShare from "./ButtonShare.svelte";
  import UserSettingsDropdown from "./UserSettingsDropdown.svelte";

  export let user;
  export let loggedIn = false;
  // TODO: once the subscription level is inside the user object, remove the below.
  export let hasPaymentDetails = false;
</script>

<header class="central-align" class:centered={loggedIn}>
  <h1 class="options">
    <PsLogo
      showName={!loggedIn}
      style={(loggedIn ? 'small' : 'large') + ' white'} />
  </h1>
  {#if user}
    <div class="options">
      {#if hasPaymentDetails}
        <ButtonShare />
      {/if}
      <UserSettingsDropdown {user} />
    </div>
  {/if}
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
</style>
