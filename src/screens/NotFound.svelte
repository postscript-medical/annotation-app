<script>
  import { onMount } from "svelte";
  import { isLoading } from "../stores";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";

  onMount(() => {
    $isLoading = false;
  });
</script>

<PsHeader />

<main class="central-align main-content">
  <h1>Page not found.</h1>

  <p>The page you have attempted to access does not exist.</p>

  <p>
    You can follow this link to head back to the
    <PsLink href="/" style="on-dark">homepage</PsLink>
    and try again.
  </p>
</main>

<style>
  main {
    max-width: 30rem;
    padding-top: 1rem;
    color: #fff;
  }

  main > :not(:last-child) {
    margin-bottom: 2rem;
  }
</style>
