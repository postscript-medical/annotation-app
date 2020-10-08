<script>
  export let href = '';
  export let onDark = false;
</script>

<a
  { href }
  class:on-dark={ onDark }
>
  <slot></slot>
</a>

<style>
  a.on-dark {
    color: white;
  }
</style>