<script>
  import { session, isLoading } from '../stores.js';

  let name;
  let email;
  let password;
 
  function submit (e) {
    const form = e.target;

    if (!$session) {
      console.error('No $session object!');
      return;
    }

    $isLoading = true;

    $session
      .signup(email.value, password.value)
      .then(response => {
        console.log('created user', response);
        // TODO: tell user to verify email address
        $isLoading = false;
        }
      )
      .catch(error => {
        console.error('Error', error);
      });
  };
</script>

<article>
  <h3>
    Sign up
  </h3>
  <form
    name="signup"
    on:submit|preventDefault={ submit }
  >
    <label>
      Email
      <input
        bind:this={ email }
        name="email"
        type="email"
        required
      />
    </label>
    <label>
      Password
      <input
        bind:this={ password }
        name="password"
        type="password"
        required
      />
    </label>
    <button
      type="submit"
    >
      Submit
    </button>
  </form>
</article>