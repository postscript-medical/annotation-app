<script>
  import PsHeader from './PsHeader.svelte';

 export let userEmail;
</script>

<div
  class="wrapper"
>
  <article>
    <h2>
      Thank you for signing up
    </h2>
    <p>
      We have just emailed <strong>{ userEmail }</strong>.
    </p>
    <p>
      Please use the link in the email to confirm your details and complete your sign up.
    </p>
    <!-- <div>
      <strong>
        Didn&apos;t receive it?
      </strong>
      <button>
        Resend
      </button>
    </div> -->
  </article>
</div>

<style>
  article {
    display: grid;
    grid-auto-rows: min-content;
    max-width: 100ch;
    padding: 14rem 3rem 0;
    position: relative;
    left: 45%;
    transform: translateX(-45%);
  }

  article > * {
    margin: 0;
  }

  h2 {
    margin-bottom: 4rem;
  }

  p {
    max-width: 40ch;
    margin-bottom: 2rem;
  }

  p:last-of-type {
    margin-bottom: 4rem;
  }

  /* button {
    margin-left: 2rem;
    border: 2px solid black;
    background-color: white;
  } */

  .wrapper {
    background-color: white;
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
  }
</style>