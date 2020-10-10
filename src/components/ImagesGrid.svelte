<script>
  export let images = [];

  $: noImages = images.length === 0;
</script>

{ #if noImages }
  <div class="no-results">
    No results found...
  </div>
{ :else }
<div class="images-grid">
  { #each images as image (image.title) }
    <div class="card">
      <img
        src={ image.src}
        alt={ image.title }
        class="shadow"
      />
      { image.title }
    </div>
  { /each }
</div>
{ /if }

<style>
  img {
    display: block;
    width: 100%;
    height: auto;
    height: 150px;
    margin-bottom: 1rem;
  }

  .images-grid {
    overflow: auto;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));
    margin-bottom: 1rem;
    padding: 0.25rem;
  }

  .card {
    width: 100%;
  }
</style>