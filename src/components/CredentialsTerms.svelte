<script>
  import PsLink from './PsLink.svelte';

  export let style = ''; /* options: 'on-dark' */
</script>

<div
  class={ style }
>
  <PsLink
    href="/terms_and_conditions.pdf"
    target="_blank"
  >
    Terms
  </PsLink>
  <PsLink
    href="/privacy_policy.pdf"
    target="_blank"
  >
    Privacy
  </PsLink>
</div>

<style>
  div > :global(*:not(:last-child)) {
    margin-right: 2rem;
  }

  .on-dark > :global(*) {
    color: white;
  }
</style>