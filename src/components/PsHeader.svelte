<script>
  import PsLogo from "./PsLogo.svelte";
  import ButtonShare from "./ButtonShare.svelte";
  import ButtonFeedback from "./ButtonFeedback.svelte";
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
      style={loggedIn ? 'small full-color' : 'large white'} />
  </h1>
  {#if user}
    <div class="options">
      <ButtonFeedback />
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
    align-items: flex-start;
    height: auto;
    max-height: none;
    padding: 1rem 1rem 0 1rem;
    pointer-events: none;
  }

  .centered {
    max-width: none;
    position: fixed;
  }

  .options {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .options > :global(*) {
    margin-right: 0.25rem;
  }

  @supports (gap: 1rem) {
    .options {
      gap: 0.25rem 0.5rem;
    }
    .options > :global(*) {
      margin-right: 0;
    }
  }
</style>
