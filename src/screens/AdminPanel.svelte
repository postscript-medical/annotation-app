<script>
  import { user } from "../stores.js";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsHeader from "../components/PsHeader.svelte";
</script>

<svelte:head>
  <style>
    body.ps-app {
      background-color: rgb(250, 250, 250);
    }
  </style>
</svelte:head>

<PsHeader user={$user} loggedIn hideButtons />

<main class="ui-content central-align">
  <h1>Administration panel</h1>

  <NavBar />
</main>
