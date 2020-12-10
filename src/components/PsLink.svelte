<script>
  export let href = '';
  export let style = ''; /* options: 'on-dark'*/
  export let target = '_self';
</script>

<a
  class={ style }
  { href }
  { target }
>
  <slot></slot>
</a>

<style>
  a.on-dark {
    color: white;
  }
</style>