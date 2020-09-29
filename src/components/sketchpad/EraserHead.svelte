<script>
  export let position = { x: -1000, y: -1000 };
  export let size = 10;

  $: radius = size / 2

  $: style = `width: ${size}px; height: ${size}px; transform: translate3d(${position.x - radius}px,${position.y - radius}px,0px);`
</script>

<div {style}></div>

<style>
  div {
    position: fixed;
    left: 0;
    top: 0;
    border: 1px solid black;
    border-radius: 50%;
    box-sizing: border-box;
    pointer-events: none;
  }
</style>