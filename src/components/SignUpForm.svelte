<script>
  import { createEventDispatcher } from 'svelte';
  import { session, isLoading } from '../stores.js';
  import CredentialsForm from './CredentialsForm.svelte';
  import PsButton from './PsButton.svelte';
  import PsLink from './PsLink.svelte';
  
  const dispatch = createEventDispatcher();
 
  let errorMessage;

  function submit ({ detail }) {
    if (!$session) {
      console.error('No $session object!');
      return;
    }

    const { email, password } = detail;

    errorMessage = undefined;
    $isLoading = true;

    $session
      .signup(email, password)
      .then(response => {
        dispatch('user-created', { email: response.email });
        $isLoading = false;
        }
      )
      .catch(error => {
        errorMessage = error.json.msg;
        $isLoading = false;
      });
  };
</script>

<CredentialsForm
  { errorMessage }
  on:submit={ submit }
>
  <div
    slot="footer"
    class="footer"
  >
    <PsButton>
      Sign up
    </PsButton>
    <div class="terms">
      <PsLink>
        Terms
      </PsLink>
      <PsLink>
        Privacy
      </PsLink>
    </div>
  </div>
</CredentialsForm>

<style>
  .footer > :global(*:not(:last-child)) {
    margin-bottom: 4rem;
  }

  .terms > :global(*:not(:last-child)) {
    margin-right: 2rem;
  }
</style>