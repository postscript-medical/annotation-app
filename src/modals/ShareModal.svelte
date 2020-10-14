<script>
  import { onMount } from 'svelte';
  import { canvas } from '../stores.js';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';
  import ButtonDownloadAnnotatedImage from '../components/ButtonDownloadAnnotatedImage.svelte';

  const dpr = window.devicePixelRatio || 1;

  let emailSent = false;
  let encodedImage;
  let email;
  let generatedImage;

  function drawTypedText (context, parentBoundingRect) {
    const entries = Array.from(document.querySelectorAll('.typed-annotation'));
    const fontSize = `${16 * dpr}px`;
    
    context.font = `${fontSize} 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
    context.textBaseline = 'middle';

    entries.forEach(entry => {
      const boundingRect = entry.getBoundingClientRect();
      const x = (boundingRect.x - parentBoundingRect.x + 7) * dpr; /* 7 is the padding in the input */
      const y = (boundingRect.y - parentBoundingRect.y + (boundingRect.height / 2)) * dpr;

      context.fillStyle = 'black';
      context.fillText(entry.value, x, y);
    });
  };

  function generateAnnotatedImage () {
    const annotatedImage = document.createElement('canvas');
    const context = annotatedImage.getContext('2d');
    const srcImg = document.querySelector('#displayed-image');
    const boundingRect = $canvas.getBoundingClientRect();

    annotatedImage.width = $canvas.width;
    annotatedImage.height = $canvas.height;

    context.fillStyle = 'white';
    context.fillRect(0,0, annotatedImage.width, annotatedImage.height);
    if (srcImg) context.drawImage(srcImg, 0, 0, annotatedImage.width, annotatedImage.height);
    context.drawImage($canvas, 0, 0);

    drawTypedText(context, boundingRect);

    return annotatedImage;
  };

  function sendEmail (event) {
    console.log('sendEmail', this);
    emailjs
      .send('5609467','postscript_annotated_img', {
        image: encodedImage,
        to_email: email.value,
      })
      .then(response => {
        console.log('Success', response);
        emailSent = true;
        // focus the close button
      })
      .catch(error => {
        console.error('Error:', error);
        emailSent = false;
        // show error message
      })
  };

  onMount(() => {
    emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");

    generatedImage = generateAnnotatedImage();
  });
</script>

<Modal
  on:close
>
  <h2>
    Email the image
  </h2>
  <form
    on:submit|preventDefault={ sendEmail }
  >
    <label>
      <input
        type="email"
        bind:this={ email }
        placeholder="Email address"
        required
      />
    </label>
    <PsButton>
      Send
    </PsButton>
  </form>
  <h2>
    Or save it to your machine
  </h2>
  <ButtonDownloadAnnotatedImage
    { generatedImage }
  />
</Modal>

<style>
  h2,
  label {
    margin-bottom: 2rem;
  }

  form {
    margin-bottom: 4rem;
  }
</style>