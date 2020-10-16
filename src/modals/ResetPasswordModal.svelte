<script>
  import { createEventDispatcher } from 'svelte';
  import { session, user } from '../stores';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const dispatch = createEventDispatcher();

  let password;

  function submitForm () {
    console.log('submit', password.value);
    $user.update({ password: password.value })
      .then((user) => console.log('Updated user %s', user))
      .catch((error) => {
        console.log('Failed to update user: %o', error);
        throw error;
      });
  };
</script>

<Modal
  on:close
>
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