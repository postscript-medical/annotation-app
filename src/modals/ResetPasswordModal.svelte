<script>
  import { createEventDispatcher } from 'svelte';
  import { session, user } from '../stores';
  import checkPasswordRequirements from '../methods/check-password-requirements.js';
  import Modal from './Modal.svelte';
  import ErrorMessage from '../components/ErrorMessage.svelte';
  import PsButton from '../components/PsButton.svelte';

  const dispatch = createEventDispatcher();

  let errorMessage;
  let password;
  let resetComplete = false;

  function closeModal () {
    dispatch('close');
  }

  function submitForm () {
    const isPasswordGood = checkPasswordRequirements(password.value);

    if (!isPasswordGood) {
      errorMessage = 'Password does not meet criteria';

      return;
    }

    $user.update({ password: password.value })
      .then(updatedUser => {
        $user = updatedUser

        resetComplete = true;
      })
      .catch((error) => {
        console.error('Failed to update user: %o', error);
        throw error;
      });
  };
</script>

<Modal
  on:close
  hideCloseButton
>
  { #if resetComplete }
    <h2>
      Reset complete
    </h2>
    <p>
      Your password has been reset.
    </p>
    <PsButton
      style="secondary"
      type="button"
      on:click={ closeModal }
    >
      Close
    </PsButton>
  { :else }
    <h2>
      Reset your current password
    </h2>
    <p>
      Please enter a new password for your account.
    </p>
    <ErrorMessage
      message={ errorMessage }
    />
    <form
      on:submit|preventDefault={ submitForm }
    >
      <label>
        <span>
          New password
        </span>
        <input
          bind:this={ password }
          type="password"
          required
        />
        <span
          class="password-requirements"
        >
          8 characters or more.
          <br/>
          Including at least one number and one special character.
        </span>
      </label>
      <PsButton>
          Confirm
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
    line-height: 1rem;
    font-size: 0.875rem;
  }

  label > :global(*:not(:last-child)) {
    margin-bottom: 0.5rem;
  }

  .password-requirements {
    color: #a1a1a1;
    font-size: 0.75rem;
  }
</style>