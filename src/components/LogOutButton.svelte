<script>
  import { user } from '../session.js';

  function logout () {
    $user
      .logout()
      .then(response => {
        console.log('logout:', response);
        user.update(() => false);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
</script>

<button on:click={ logout }>
  Logout
</button>