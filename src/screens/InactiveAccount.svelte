<script>
  import { user, organization } from "../stores";
  import PsHeader from "../components/PsHeader.svelte";
  import ManageSubscription from "../components/ManageSubscription.svelte";
  import SignUpPlans from "../components/SignUpPlans.svelte";
  import PsLink from "../components/PsLink.svelte";
</script>

<svelte:head>
  <style>
    body.ps-app {
      background-color: rgb(250, 250, 250);
    }
  </style>
</svelte:head>

<PsHeader user={$user} loggedIn hideButtons />

<main class="central-align ui-content">
  <h1>Welcome to PostScript</h1>

  {#if $organization.stripeID}
    <p>
      In order to activate your account, <ManageSubscription
        >follow this link to select your plan</ManageSubscription
      >.
    </p>

    <p>
      Once your payment is complete, you will be able to access the resources
      within your selected membership level.
    </p>
  {:else}
    <p>Choose your subscription level.</p>

    <SignUpPlans />
  {/if}

  <p>
    Please note we only support modern browsers such as <PsLink
      href="https://www.microsoft.com/en-us/edge">Microsoft Edge</PsLink
    >, <PsLink href="https://www.mozilla.org/en-GB/firefox/new/"
      >Mozilla Firefox</PsLink
    >, <PsLink href="https://www.google.com/chrome/">Google Chrome</PsLink>.
  </p>
</main>

<style>
  main {
    max-width: 90%;
    display: flex;
    flex-direction: column;
  }
</style>
