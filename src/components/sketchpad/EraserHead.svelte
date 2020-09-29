<script>
  export let position = { x: 0, y: 0 };
  export let radius = 20;

  $: updatedPosition = `transform: translate3d(${position.x - radius}px,${position.y - radius}px,0px);`
</script>

<div style={ updatedPosition } ></div>

<style>
  div {
    position: absolute;
    left: 0;
    top: 0;
    border: 1px solid black;
    border-radius: 50%;
    box-sizing: border-box;
    width: 40px;
    height: 40px;
    pointer-events: none;
  }
</style>