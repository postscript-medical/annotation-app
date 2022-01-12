<script>
  import { user } from "../stores";
  import PsHeader from "../components/PsHeader.svelte";
  import ManageSubscription from "../components/ManageSubscription.svelte";

  $: email = $user && $user.email;
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

  <p>
    In order to activate your account, <ManageSubscription
      >follow this link to choose your desired subscription level</ManageSubscription
    >.
  </p>

  <p>
    You will be redirect to Stripe, where you be asked to provide your card
    details.
  </p>

  <p>
    Once your payment is complete, you will be able to access the resources
    whitin your selected membership level.
  </p>
</main>

<style>
  main {
    max-width: 40rem;
    display: flex;
    flex-direction: column;
  }
</style>
