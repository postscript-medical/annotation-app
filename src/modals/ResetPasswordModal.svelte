<script>
  import { createEventDispatcher } from 'svelte';
  import { session, user } from '../stores';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const dispatch = createEventDispatcher();

  let password;
  let resetComplete = false;

  function closeModal () {
    dispatch('close');
  }

  function submitForm () {
    console.log('submit', password.value);
    $user.update({ password: password.value })
      .then(updatedUser => {
        console.log('Updated user %s', updatedUser)
        $user = updatedUser

        resetComplete = true;
      })
      .catch((error) => {
        console.log('Failed to update user: %o', error);
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
      </label>
      <PsButton
        style="secondary"
      >
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
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    line-height: 1rem;
  }
</style>