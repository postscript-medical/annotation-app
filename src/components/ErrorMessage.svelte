<script>
  export let message;
</script>

{ #if message }
  <div>
    { message }
  </div>
{ /if }

<style>
  div {
    background-color: red;
    border-radius: 0.25rem;
    padding: 0.5rem;
    color: white;
    margin-bottom: 1rem;
  }
</style>