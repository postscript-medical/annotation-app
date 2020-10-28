<script>
  export let href;
  export let onDark = false;
</script>

<a
  class:on-dark={ onDark }
  { href }
>
  <slot>
    Manage subscription
  </slot>
</a>

<style>
  .on-dark {
    color: white;
  }
</style>