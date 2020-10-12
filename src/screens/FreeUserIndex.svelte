<script>
  import ManageSubscription from '../components/ManageSubscription.svelte';
</script>

<main>
  <span>
    Show me the money
    <ManageSubscription />
  </span>
</main>

<style>
  main {
    background-position: bottom right;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('/images/medical/v1602510330/postscript-medical/annotation-app/bg_logo.svg'),
      linear-gradient(
        to right,
        white,
        white 45%,
        rgb(55, 154, 70) 45%
      );
    display: grid;
    grid-template-columns: 45fr 57.5fr;
    grid-template-rows: min-content 1fr;
    grid-gap: 0 8rem;
    padding: 10rem 8rem 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>