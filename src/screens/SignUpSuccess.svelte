<script>
  import { onMount } from "svelte";
  import { isLoading } from "../stores.js";

  onMount(() => {
    $isLoading = false;
  });
</script>

<main class="central-align main-content">
  <header>
    <h2>Subscription success</h2>
  </header>
</main>
