<script>
  import PsButton from './PsButton.svelte';

  export let generatedImage;

  function downloadImage () {
    console.log('downloadImage');
    const encodedImage = generatedImage.toDataURL('image/jpg', 0.7);
    const hiddenLink = document.createElement('a');

    hiddenLink.setAttribute('href', encodedImage);
    hiddenLink.setAttribute('download', 'myImage.jpg');
    hiddenLink.click();
  };
</script>

<PsButton
    style="secondary"
    on:click={ downloadImage }
  >
    Download image
</PsButton>