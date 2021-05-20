<script>
  import PsLink from "./PsLink.svelte";

  export let style = ""; /* options: 'on-dark' */
</script>

<div class={style}>
  <PsLink
    href="https://www.postscriptmedical.com/terms-of-use/"
    target="_blank">
    Terms
  </PsLink>
  <PsLink
    href="https://www.postscriptmedical.com/privacy-policy/"
    target="_blank">
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
