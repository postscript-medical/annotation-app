<script>
  import { customerPortalUrl } from "../stores.js";

  export let onDark = false;
</script>

<a class:on-dark={onDark} href={$customerPortalUrl}>
  <slot>Manage subscription</slot>
</a>

<style>
  .on-dark {
    color: white;
  }
</style>
