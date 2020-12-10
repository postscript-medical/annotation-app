<script>
  import PsLink from './PsLink.svelte';

  export let onDark = false;
</script>

<div
  class="terms"
  class:on-dark={ onDark }
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
  .terms > :global(*:not(:last-child)) {
    margin-right: 2rem;
  }

  .terms.on-dark > :global(*) {
    color: white;
  }
</style>