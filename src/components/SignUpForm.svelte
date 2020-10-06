<script>
  import { session, isLoading } from '../stores.js';
  import CredentialsForm from './CredentialsForm.svelte';
 
  let errorMessage;

  function submit ({ detail }) {
    console.log('submit', detail);
    // if (!$session) {
    //   console.error('No $session object!');
    //   return;
    // }

    // $isLoading = true;

    // $session
    //   .signup(email.value, password.value)
    //   .then(response => {
    //     console.log('created user', response);
    //     // TODO: tell user to verify email address
    //     $isLoading = false;
    //     }
    //   )
    //   .catch(error => {
    //     console.error('Error', error);
    //   });
  };
</script>

<CredentialsForm
  on:submit={ submit }
/>