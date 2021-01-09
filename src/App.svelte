<script>
  import Router from "svelte-spa-router";
  import routes from "./routes";
  import { user, isLoading, organization } from "./stores.js";
  import ErrorModal from "./modals/ErrorModal.svelte";
  import LoadingOverlay from "./components/LoadingOverlay.svelte";
  import PsHeader from "./components/PsHeader.svelte";

  let errorMessage = "";

  $: hasPaymentDetails =
    $organization && !!($organization.subscriptionLevel !== "inactive");

  function clear_errors() {
    errorMessage = "";
  }

  function handle_route_event({ detail }) {
    if (detail.errorMessage) {
      errorMessage = detail.errorMessage;
    }
  }
</script>

<PsHeader loggedIn={!!$user} {hasPaymentDetails} user={$user} />

<Router {routes} on:routeEvent={handle_route_event} />

{#if errorMessage}
  <ErrorModal on:close={clear_errors}>
    <p>{errorMessage}</p>
  </ErrorModal>
{/if}

<LoadingOverlay loading={$isLoading} />
