<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import ErrorMessage from '../components/ErrorMessage.svelte';
  import PsButton from '../components/PsButton.svelte';

  export let loading = false;
  export let emailSent = false;
  export let errorMessage = '';

  const dispatch = createEventDispatcher();

  let email;
  let showThankYou = false;

  function submitForm () {
    dispatch('request-reset-password', email.value);
  };

  function tweenOutComplete () {
    showThankYou = true;
  }
</script>

<Modal
  cancelBtCopy="Close"
  confirmBtCopy="Send link"
  hideCancelButton={ !emailSent || !showThankYou }
  hideConfirmButton={ emailSent && showThankYou }
  { loading }
  on:close
  on:confirm={ submitForm }
  on:tweenOutComplete={ tweenOutComplete }
>
  <span
    slot="header"
  >
    { #if emailSent && showThankYou }
      Request sent successfully
    { :else }
      Request a recovery password email
    { /if }
  </span>

  <ErrorMessage
    message={ errorMessage }
  />

  { #if emailSent && showThankYou }
    <p>
      Please await a few moments before checking your email for a recovery link.
    </p>
  { :else }
    <p>
      Please enter the email address you registered with and we will email you a link to reset your password.
    </p>
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