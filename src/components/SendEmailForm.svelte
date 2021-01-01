<script>
  /*global emailjs*/
  /*eslint no-undef: "error"*/

  import { createEventDispatcher, onMount } from "svelte";

  export let encodedImage;

  const dispatch = createEventDispatcher();
  let emailSent = false;
  let toEmail = "";
  let toName = "patient";

  // The modal functionality should be moved to a modal component
  function closeModal() {
    dispatch("close", true);
  }

  function sendEmail() {
    emailjs
      .send("5609467", "postscript_annotated_img", {
        image: encodedImage,
        to_email: toEmail,
        to_name: toName,
      })
      .then(() => {
        emailSent = true;
        // focus the close button
      })
      .catch((error) => {
        console.error("Error:", error);
        emailSent = false;
        // show error message
      });
  }

  onMount(() => {
    emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");
  });
</script>

<div class="overlay">
  <article>
    <button class="close-button" on:click={closeModal}> Close </button>
    {#if emailSent}
      <div>Email sent, thank you</div>
    {:else}
      <form on:submit|preventDefault={sendEmail}>
        <label>
          Email
          <!-- svelte-ignore a11y-autofocus -->
          <input type="email" bind:value={toEmail} required autofocus />
        </label>
        <label> Name <input type="text" bind:value={toName} /> </label>
        <button type="submit"> Send </button>
      </form>
    {/if}
  </article>
</div>

<style>
  article {
    position: relative;
    background-color: white;
    padding: 1rem;
  }

  .overlay {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.65);
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
