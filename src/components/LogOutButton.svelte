<script>
  import {
    user,
    isLoading
  } from '../stores.js';
    import { STORAGE_KEY } from '../constants/session.js'
  import loadProtectedContent from '../methods/load-protected-content.js';

  function logout () {
    $isLoading = true;

    $user
      .logout()
      .then(response => {
        console.log('logout:', response);
        $user = null;
        loadProtectedContent($user);
        window.sessionStorage.removeItem(STORAGE_KEY);
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