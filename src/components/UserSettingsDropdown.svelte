<script>
  /*global gsap*/
  /*eslint no-undef: "error"*/

  import {
    protectedContent,
    userSettingsDropdownDrawerOpen,
  } from "../stores.js";
  import SignOutButton from "./SignOutButton.svelte";
  import ManageSubscription from "./ManageSubscription.svelte";
  import PsLink from "./PsLink.svelte";

  export let user;

  function toggleDrawer() {
    $userSettingsDropdownDrawerOpen = !$userSettingsDropdownDrawerOpen;
  }

  function tween() {
    const tl = gsap.timeline({ paused: true });

    tl.from(".dropdown", {
      duration: 0.05,
      scale: 0,
      transformOrigin: "100% 0%",
      ease: "circ.inOut",
    }).from(".dropdown > *", {
      duration: 0.05,
      opacity: 0,
      ease: "none",
      stagger: 0.025,
    });

    const duration = tl.totalDuration();

    return {
      duration: duration * 1000,
      tick: (t) => {
        tl.progress(t);
      },
    };
  }
</script>

<div class="user-settings-dropdown">
  <button class="dropdown-button" on:click={toggleDrawer}>
    <span class="user-avatar"> {user.email[0].toUpperCase()} </span>
  </button>
  {#if $userSettingsDropdownDrawerOpen}
    <div class="dropdown shadow" transition:tween>
      <PsLink href="#/annotate" style="on-dark">Annotate image</PsLink>
      {#if $protectedContent.role === 'owner'}
        <ManageSubscription onDark />
        <PsLink href="#/manage-team" style="on-dark">
          Manage team members
        </PsLink>
      {/if}
      <SignOutButton inline />
    </div>
  {/if}
</div>

<style>
  .user-settings-dropdown {
    position: relative;
  }

  .dropdown-button {
    border: 0;
    background-color: rgb(42, 41, 41);
    color: white;
    border-radius: 50%;
    padding: 0;
  }

  .dropdown {
    position: absolute;
    right: 0;
    top: 115%;
    background-color: rgb(42, 41, 41);
    padding: 2rem;
    border-radius: 0.5rem;
    min-width: 30ch;
    display: flex;
    flex-direction: column;
  }

  .dropdown > :global(*:not(:last-child)) {
    margin-bottom: 1rem;
  }

  .user-avatar {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
