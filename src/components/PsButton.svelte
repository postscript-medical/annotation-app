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
  }

  button.on-dark {
    background-color: white;
    color: black;
  }
</style>