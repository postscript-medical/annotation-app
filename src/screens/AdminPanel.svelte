<script>
  import { onDestroy } from "svelte";
  import NavBar from "../components/admin/NavBar.svelte";

  /*
   * This is hacky as hell but there is no current better alternative as far as I know currently
   * https://github.com/sveltejs/svelte/issues/3105
   */
  document.body.classList.add("manage-team");

  onDestroy(() => {
    document.body.classList.remove("manage-team");
  });
</script>

<main class="main-content central-align">
  <h1>Administration panel</h1>

  <NavBar />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
</style>
