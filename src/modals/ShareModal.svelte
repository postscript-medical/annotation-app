<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { canvas, dpr, illustrationDisplayed } from '../stores.js';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';
  import ButtonDownloadAnnotatedImage from '../components/ButtonDownloadAnnotatedImage.svelte';

  const dispatch = createEventDispatcher();

  let emailSent = false;
  let email;
  let generatedImage;
  let sendingEmail = false;

  function close () {
    dispatch('close');
  };

  function drawTypedText (context, parentBoundingRect) {
    const entries = Array.from(document.querySelectorAll('.typed-annotation'));
    const fontSize = `${16 * $dpr}px`;
    
    context.font = `${fontSize} 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
    context.textBaseline = 'middle';

    entries.forEach(entry => {
      const boundingRect = entry.getBoundingClientRect();
      const x = (boundingRect.x - parentBoundingRect.x + 7) * $dpr; /* 7 is the padding in the input */
      const y = (boundingRect.y - parentBoundingRect.y + (boundingRect.height / 2)) * $dpr;

      context.fillStyle = 'black';
      context.fillText(entry.value, x, y);
    });
  };

  function generateAnnotatedImage () {
    const annotatedImage = document.createElement('canvas');
    const context = annotatedImage.getContext('2d');
    const boundingRect = $canvas.getBoundingClientRect();

    annotatedImage.width = $canvas.width;
    annotatedImage.height = $canvas.height;

    context.fillStyle = 'white';
    context.fillRect(0,0, annotatedImage.width, annotatedImage.height);
    if ($illustrationDisplayed) context.drawImage($illustrationDisplayed, 0, 0, annotatedImage.width, annotatedImage.height);
    context.drawImage($canvas, 0, 0);

    drawTypedText(context, boundingRect);

    return annotatedImage;
  };

  function sendEmail (event) {
    sendingEmail = true;
    const encodedImage = generatedImage.toDataURL()
    emailjs
      .send('5609467','postscript_annotated_img', {
        image: encodedImage,
        to_email: email.value,
      })
      .then(response => {
        emailSent = true;
        sendingEmail = false;
        // focus the close button
      })
      .catch(error => {
        console.error('Error:', error);
        emailSent = false;
        sendingEmail = false;
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
  { #if emailSent }
    <h2>
      Your email has been sent.
    </h2>
    <p>
     You can now close this window.
    </p>
    <form
      on:submit|preventDefault={ close }
    >
      <PsButton
        style="secondary"
      >
        Close
      </PsButton>
    </form>
  { :else }
    <h2>
      Email the image to someone
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
        <PsButton
          disabled={ sendingEmail }
        >
          Send
        </PsButton>
    </form>
    { /if }
  <h2>
    Save the image to your machine
  </h2>
  <ButtonDownloadAnnotatedImage
    { generatedImage }
  />
</Modal>

<style>
  h2,
  label,
  p {
    margin-bottom: 2rem;
  }

  form {
    margin-bottom: 4rem;
  }
</style>