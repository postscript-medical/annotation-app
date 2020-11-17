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

    errorMessage = undefined;

    if (!isPasswordGood) {
      errorMessage = 'Password does not meet criteria.';

      return;
    }

    // TODO: Move this logic to the parent component
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
  cancelBtCopy="Close"
  confirmBtCopy="Reset password"
  hideCloseButton
  hideCancelButton={ !resetComplete }
  hideConfirmButton={ resetComplete }
  on:confirm={ submitForm }
  on:close
>
  <span
    slot="header"
  >
    { #if resetComplete }
      Reset complete
    { :else }
      Reset your password
    { /if }
  </span>
  { #if resetComplete }
    <p>
      Your password has been successfully reset.
    </p>
  { :else }
    <ErrorMessage
      message={ errorMessage }
    />
    <div>
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
    </div>
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