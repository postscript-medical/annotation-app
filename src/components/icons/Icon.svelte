
<script>
  export let onDark = false;
</script>
<svg
  class="tool-icon"
  class:on-dark={ onDark }
  width="24px"
  height="24px"
  viewBox="0 0 24 24"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <slot></slot>
</svg>