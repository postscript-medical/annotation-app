<script>
  import { location } from "svelte-spa-router";
  import PsLink from "../PsLink.svelte";

  const links = [
    {
      label: "Admin panel",
      url: "/admin",
    },
    {
      label: "Edit illustrations",
      url: "/admin/illustrations",
    },
    {
      label: "Edit sup-specialties",
      url: "/admin/sub-specialties",
    },
    {
      label: "Manage organizations",
      url: "/admin/organizations",
    },
  ];
</script>

<ul class="wrapper plain">
  {#each links as { label, url }}
    <li>
      {#if $location === url}
        {label}
      {:else}
        <PsLink href={`#${url}`}>
          {label}
        </PsLink>
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul {
    margin: 0 0 1rem 0;
    padding: 0;
  }
</style>
