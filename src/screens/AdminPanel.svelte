<script>
  import { onDestroy } from "svelte";
  import { user } from "../stores.js";
  import NavBar from "../components/admin/NavBar.svelte";
  import PsHeader from "../components/PsHeader.svelte";

  /*
   * This is hacky as hell but there is no current better alternative as far as I know currently
   * https://github.com/sveltejs/svelte/issues/3105
   */
  document.body.classList.add("manage-team");

  onDestroy(() => {
    document.body.classList.remove("manage-team");
  });
</script>

<div class="ui-content central-align">
  <PsHeader user={$user} loggedIn hideButtons />

  <h1>Administration panel</h1>

  <NavBar />
</div>
