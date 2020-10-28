<script>
  import {
    createEventDispatcher,
    onDestroy,
    onMount
  } from 'svelte';
  import { session, isLoading } from '../stores.js';
  import CredentialsForm from './CredentialsForm.svelte';
  import PsButton from './PsButton.svelte';
  
  const dispatch = createEventDispatcher();
  const mediaQueryList = window.matchMedia('(min-width: 600px)');
 
  let errorMessage;
  let showTerms = false;

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

  function toggleShowTerms (queryList) {
    if (queryList.matches) {
      showTerms = true;
    } else {
      showTerms = false;
    };
  };

  onMount(() => {
    toggleShowTerms(mediaQueryList);
    mediaQueryList.addListener(toggleShowTerms);
  });

  onDestroy(() => {
    mediaQueryList.removeListener(toggleShowTerms);
  });
</script>

<CredentialsForm
  { errorMessage }
  showPasswordRequirements
  { showTerms }
  on:submit={ submit }
  on:error={ ({ detail }) => errorMessage = detail }
/>