<script>
  import { user, isLoading } from '../stores.js';
  import loadProtectedContent from '../methods/load-protected-content.js';

  function logout () {
    $isLoading = true;

    $user
      .logout()
      .then(response => {
        console.log('logout:', response);
        $user = false;
        loadProtectedContent($user);
        $isLoading = false;
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
</script>

<button on:click={ logout }>
  Logout
</button>