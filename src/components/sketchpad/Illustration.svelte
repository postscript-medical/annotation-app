<script>
  export let name = "";

  $: src = "images/annotation-app/illustrations/" + name;
</script>

<img id="source-illustration" {src} alt="" />

<style>
  img {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
