<script>
  import { session } from '../session.js';
 
  function submit (e) {
    e.preventDefault();

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

<form name="signup" on:submit|preventDefault={ submit }>
  <label>
    Email
    <input type="email" name="email" />
  </label>
  <label>
    Password
    <input type="password" name="password" />
  </label>
  <button type="submit">
    Submit
  </button>
</form>