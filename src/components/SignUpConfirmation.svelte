<script>
  import PsHeader from './PsHeader.svelte';

 export let userEmail;
</script>

{ #if userEmail }
  <article>
    <PsHeader />
    <h2>
      Thank you for signing up
    </h2>
    <p>
      We have just emailed <strong>{ userEmail }</strong>.
    </p>
    <p>
      Please use the link in the email to confirm your details and complete your sign up.
    </p>
    <div>
      <strong>
        Didn&apos;t receive it?
      </strong>
      <button>
        Resend
      </button>
    </div>
  </article>
{ /if }

<style>
  article {
    background-color: white;
    display: grid;
    grid-auto-rows: min-content;
    height: 100%;
    left: 0;
    padding: 4rem 8rem;
    position: fixed;
    top: 0;
    width: 100%;
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

  button {
    margin-left: 2rem;
    border: 2px solid black;
    background-color: white;
  }
</style>