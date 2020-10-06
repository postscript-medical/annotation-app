<script>
  import { createEventDispatcher } from 'svelte';
  import { session, isLoading } from '../stores.js';
  import CredentialsForm from './CredentialsForm.svelte';
  
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
/>