<script>
  export let onDark = false;
</script>

<button
  class={ onDark ? 'on-dark' : '' }>
  <slot></slot>
</button>

<style>
  button {
    background-color: green;
    border-radius: 0.25rem;
    border: transparent;
    color: white;
    margin: 0;
    padding: 0.75rem 1.25rem;
  }

  button.on-dark {
    background-color: white;
    color: black;
  }
</style>