<script>
  import { ROLE_OWNER, ROLE_DM } from "../constants/defaults.js";
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
    }).to(
      ".dropdown > *",
      {
        duration: 0.1,
        opacity: 1,
        ease: "none",
        stagger: 0.025,
      },
      "+=0.05"
    );

    const duration = tl.totalDuration();

    return {
      duration: duration * 1000,
      tick: (t) => {
        tl.progress(t);
      },
    };
  }
</script>

<div class="user-settings-dropdown" on:click={toggleDrawer}>
  <button class="dropdown-button">
    <span class="user-avatar"> {user.email[0].toUpperCase()} </span>
  </button>
  {#if $userSettingsDropdownDrawerOpen}
    <div class="dropdown shadow" transition:tween>
      <PsLink href="#/annotate" style="on-dark">Annotate image</PsLink>
      {#if $protectedContent.role === ROLE_OWNER}
        <ManageSubscription onDark />
      {/if}
      {#if [ROLE_OWNER, ROLE_DM].includes($protectedContent.role)}
        <PsLink href="#/manage-team" style="on-dark">
          Manage team members
        </PsLink>
      {/if}
      {#if $protectedContent.role === ROLE_DM}
        <PsLink href="#/admin" style="on-dark">Admin panel</PsLink>
      {/if}
      <SignOutButton inline />
    </div>
  {/if}
</div>

<style>
  .user-settings-dropdown {
    position: relative;
    display: flex; /* IE11 */
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

  .dropdown > :global(*) {
    opacity: 0;
  }

  .dropdown > :global(:not(:last-child)) {
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
