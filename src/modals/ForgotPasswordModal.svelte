<script>
  import { createEventDispatcher } from 'svelte';
  import { session } from '../stores';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const dispatch = createEventDispatcher();

  let email;

  function submitForm () {
    console.log('submit', email.value);
    $session.requestPasswordRecovery(email.value)
      .then(response => console.log('Recovery email sent', { response } ))
      .catch(error => console.error('Error', error))
  };
</script>

<Modal
  on:close
>
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
      style="secondary"
    >
        Send link
    </PsButton>
  </form>
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