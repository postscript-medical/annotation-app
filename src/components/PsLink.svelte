<script>
  export let href = '';
  export let onDark = false;
</script>

<a
  { href }
  class={ onDark ? 'on-dark' : '' }
>
  <slot></slot>
</a>

<style>
  a.on-dark {
    color: white;
  }
</style>