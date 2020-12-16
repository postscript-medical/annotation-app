<script>
  import {
    DEFAULT_SIZE,
    SIZE_SMALL,
    SIZE_MEDIUM,
    SIZE_LARGE,
  } from "../../constants/defaults.js";
  import Icon from "./Icon.svelte";

  export let size = DEFAULT_SIZE;
</script>

<Icon>
  <title>Icon: line thickness</title>
  {#if size === SIZE_SMALL}
    <circle cx="12" cy="12" r="6" />
  {:else if size === SIZE_MEDIUM}
    <circle cx="12" cy="12" r="9" />
  {:else if size === SIZE_LARGE}
    <circle cx="12" cy="12" r="12" />
  {/if}
</Icon>
