<script>
  import { showShareModal } from '../stores.js';

  function click () {
    $showShareModal = !$showShareModal;
  }
</script>

<button
  on:click={ click }
>
  Share
</button>

<style>
  button {
    background-color: rgb(55, 154, 70);
    border: 0;
    border-radius: 1.5rem;
    color: white;
    line-height: 1.5;
    margin: 0;
  }
</style>