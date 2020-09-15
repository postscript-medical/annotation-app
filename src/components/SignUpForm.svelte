<script>
  import { session } from '../stores.js';
 
  function submit (e) {
    const form = e.target;

    if (!$session) {
      console.error('No $session object!');
      return;
    }

    const {
      email,
      password
    } = form.elements;

    $session
      .signup(email.value, password.value)
      .then(response => {
        console.log('created user', response);
        }
      )
      .catch(error => {
        console.error('Error', error);
      });
  }
</script>

<article>
  <h3>Sign up</h3>
  <form name="signup" on:submit|preventDefault={ submit }>
    <label>
      Email
      <input type="email" name="email" required />
    </label>
    <label>
      Password
      <input type="password" name="password" required />
    </label>
    <button type="submit">
      Submit
    </button>
  </form>
</article>