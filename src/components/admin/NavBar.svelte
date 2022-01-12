<script>
  import { location } from "svelte-spa-router";
  import PsLink from "../PsLink.svelte";
</script>

<ul class="wrapper plain">
  <li>
    {#if $location === "/admin"}
      Admin panel
    {:else}
      <PsLink href="#/admin">Admin panel</PsLink>
    {/if} |
  </li>
  <li>
    {#if $location === "/admin/illustrations"}
      Edit illustrations
    {:else}
      <PsLink href="#/admin/illustrations">Edit illustrations</PsLink>
    {/if} |
  </li>
  <li>
    {#if $location === "/admin/sub-specialties"}
      Edit sup-specialties
    {:else}
      <PsLink href="#/admin/sub-specialties">Edit Sub-specialties</PsLink>
    {/if}
  </li>
</ul>

<style>
  ul {
    margin: 0 0 1rem 0;
    padding: 0;
  }
</style>
