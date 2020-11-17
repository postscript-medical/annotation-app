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
    error = undefined;
    sendingEmail = true;

    if (!email.value) {
      error = {
        json: {
          msg: 'Please enter a valid email address.'
        }
      }
      return;
    };

    if (!$session) {
      error = {
        json: {
          msg: 'User session not authenticated. Please log out and log back in.'
        }
      };

      return;
    };

    // TODO: Move this logic to the parent component
    $session.requestPasswordRecovery(email.value)
      .then(response => {
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
  cancelBtCopy="Close"
  confirmBtCopy="Send link"
  hideCancelButton={ !emailSent }
  hideConfirmButton={ emailSent }
  on:close
  on:confirm={ submitForm }
>
  <ErrorMessage
    message={ errorMessage }
  />
    <span
      slot="header"
    >
      { #if emailSent }
        Request sent successfully
      { :else }
        Request a recovery password email
      { /if }
    </span>

  { #if emailSent }
    <p>
      Please await a few moments before checking your email for a recovery link.
    </p>
  { :else }
    <p>
      Please enter the email address you registered with and we will email you a link to reset your password.
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