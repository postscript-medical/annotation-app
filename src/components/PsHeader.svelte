<script>
  import { location } from "svelte-spa-router";
  import PsLogo from "./PsLogo.svelte";
  import ButtonShare from "./ButtonShare.svelte";
  import ButtonFeedback from "./ButtonFeedback.svelte";
  import UserSettingsDropdown from "./UserSettingsDropdown.svelte";

  export let user = undefined;
  export let loggedIn = false;
  export let hideButtons = false;
</script>

<header class:padded={!loggedIn}>
  <h1 class="options">
    {#if $location === "/annotate"}
      <PsLogo
        showName={!loggedIn}
        style={loggedIn ? "small full-color" : "large white"}
      />
    {:else}
      <a href="#/annotate">
        <PsLogo
          showName={!loggedIn}
          style={loggedIn ? "small full-color" : "large white"}
        />
      </a>
    {/if}
  </h1>
  {#if user}
    <div class="options">
      {#if !hideButtons}
        <ButtonFeedback />

        <ButtonShare />
      {/if}

      <UserSettingsDropdown {user} />
    </div>
  {/if}
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
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

  .padded {
    padding: 1rem 1rem 0 1rem;
  }
</style>
