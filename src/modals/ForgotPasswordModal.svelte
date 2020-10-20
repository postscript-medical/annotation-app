<script>
  import { createEventDispatcher } from 'svelte';
  import { session } from '../stores';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';
  import ErrorMessage from '../components/ErrorMessage.svelte';

  const dispatch = createEventDispatcher();

  let email;
  let emailSent = false;
  let error;
  let sendingEmail = false;

  $: errorMessage = error && error.json.msg;

  function close () {
    dispatch('close');
  }

  function submitForm () {
    sendingEmail = true;

    $session.requestPasswordRecovery(email.value)
      .then(response => {
        console.log('Recovery email sent', { response } )
        emailSent = true;
        sendingEmail = false;
      })
      .catch(err => {
        console.error('Error', err)
        error = err;
        sendingEmail = false;
      })
  };
</script>

<Modal
  on:close
>
  <ErrorMessage
    message={ errorMessage }
  />

  { #if emailSent }
    <h2>
      Request sent successfully
    </h2>
    <p>
      Please await a few moments before checking your email for a recovery link.
    </p>
    <PsButton
      style="secondary"
      on:click={ close }
    >
      Close
    </PsButton>
  { :else }
    <h2>
      Request a recovery password email
    </h2>
    <p>
      Just enter the email address you registered with below and we will email you a link to reset your password.
    </p>
    <form
      on:submit|preventDefault={ submitForm }
    >
      <label>
        <span>
          Email
        </span>
        <input
          bind:this={ email }
          type="email"
          required
        />
      </label>
      <PsButton
        disabled={ sendingEmail }
      >
          Send link
      </PsButton>
    </form>
  { /if }
</Modal>

<style>
  label {
    display: flex;
    flex-direction: column;
  }

  label > :global(span) {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    line-height: 1rem;
  }
</style>