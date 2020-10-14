<script>
  import { onMount } from 'svelte';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

  export let encodedImage;

  let emailSent = false;
  let email;

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
  }

  onMount(() => {
    emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");
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
  <PsButton
    type="secondary"
  >
    Download image
  </PsButton>
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