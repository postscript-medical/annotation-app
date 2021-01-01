<script>
  export let message;
</script>

{#if message}
  <div>{message}</div>
{/if}

<style>
  div {
    background-color: white;
    background-image: linear-gradient(
      to right,
      #df0303,
      #df0303 2.5rem,
      white 2.5rem
    );
    border: 1px solid #df0303;
    border-radius: 0.25rem;
    padding: 0.5rem;
    color: #df0303;
    padding-left: 3rem;
    font-size: 0.875rem;
    line-height: 1rem;
  }
</style>
