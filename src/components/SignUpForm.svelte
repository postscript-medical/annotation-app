<script>
  import {
    createEventDispatcher,
  } from 'svelte';
  import {
    isLoading,
    session,
    viewportType
  } from '../stores.js';
  import { VIEWPORT_PHONE } from '../constants/defaults.js';
  import CredentialsForm from './CredentialsForm.svelte';
  import PsButton from './PsButton.svelte';
  
  const dispatch = createEventDispatcher();
 
  let errorMessage;

  $: showTerms = $viewportType !== VIEWPORT_PHONE;

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
  showPasswordRequirements
  { showTerms }
  on:submit={ submit }
  on:error={ ({ detail }) => errorMessage = detail }
/>