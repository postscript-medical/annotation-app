<script>
  import PsLink from './PsLink.svelte';

  export let onDark = false;
</script>

<div
  class="terms"
  class:on-dark={ onDark }
>
  <PsLink>
    Terms
  </PsLink>
  <PsLink>
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