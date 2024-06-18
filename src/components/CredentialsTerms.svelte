<script>
  import PsLink from "./PsLink.svelte";

  import { privacy_policy, terms_and_conditions } from "../constants/urls";

  export let style = ""; /* options: 'on-dark' */
</script>

<div class={style}>
  <PsLink href={terms_and_conditions} target="_blank">Terms of use</PsLink>
  <PsLink href={privacy_policy} target="_blank">Privacy policy</PsLink>
</div>

<style>
  div > :global(*:not(:last-child)) {
    margin-right: 2rem;
  }

  .on-dark > :global(*) {
    color: white;
  }
</style>
