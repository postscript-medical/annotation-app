<script>
  import { user, isLoading } from '../stores.js';
  import { STORAGE_KEY } from '../constants/session.js'
  import loadProtectedContent from '../methods/load-protected-content.js';
  import PsButton from './PsButton.svelte';

  export let inline;

  const DEFAULT_MESSAGE = 'Log out';

  function logout () {
    $isLoading = true;

    $user
      .logout()
      .then(response => {
        $user = null;
        loadProtectedContent($user);
        window.sessionStorage.removeItem(STORAGE_KEY);
        // TODO: reset the application state
        $isLoading = false;
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };
</script>

{ #if inline }
  <button
    class="link-style"
    on:click={ logout }
  >
    <slot>
      { DEFAULT_MESSAGE }
    </slot>
  </button>
{ :else }
  <PsButton
    type="secondary"
    on:click={ logout }
  >
    { DEFAULT_MESSAGE }
  </PsButton>
{ /if }