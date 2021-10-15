<script>
  import Router from "svelte-spa-router";
  import routes from "./routes";
  import { isLoading } from "./stores.js";
  import ErrorModal from "./modals/ErrorModal.svelte";
  import LoadingOverlay from "./components/LoadingOverlay.svelte";

  let errorMessage = "";

  function clear_errors() {
    errorMessage = "";
  }

  function handle_route_event({ detail }) {
    if (detail.errorMessage) {
      errorMessage = detail.errorMessage;
    }
  }
</script>

<Router {routes} on:routeEvent={handle_route_event} />

<div class="tooltip-container" />

{#if errorMessage}
  <ErrorModal on:close={clear_errors}>
    <p>{errorMessage}</p>
  </ErrorModal>
{/if}

<LoadingOverlay loading={$isLoading} />
