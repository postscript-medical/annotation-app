<script>
  import { session, user } from '../stores.js';

  function loginUser (e) {
    const form = e.target;

    if (!$session) {
      console.log('No $session object!');
      return;
    }

    const {
      email,
      password
    } = form.elements;

    $session
      .login(email.value, password.value, true)
      .then(response => {
        console.log('Success', response);
        console.log('user', $session.currentUser());
        user.update(() => response);
        // 
      })
      .catch(error => {
        console.error("Error:", error);
      })
  }
</script>

<article>
  <h3>Login</h3>
  <form name="login" on:submit|preventDefault={ loginUser }>
    <label>
    Email
    <input type="email" name="email" required />
  </label>
  <label>
    Password
    <input type="password" name="password" required />
  </label>
  <button type="submit">
    Log in
  </button>
</form>
</article>