<script>
  import {
    actions,
    isLoading,
    user,
  } from '../stores.js';
  import { STORAGE_KEY } from '../constants/session.js'
  import closeUserSettingsDropdown from '../methods/closeUserSettingsDropdown.js';
  import loadProtectedContent from '../methods/load-protected-content.js';
  import PsButton from './PsButton.svelte';

  export let asLink = false;

  function logout () {
    $isLoading = true;

    $user
      .logout()
      .then(response => {
        $user = null;

        loadProtectedContent($user);

        window.sessionStorage.removeItem(STORAGE_KEY);

        $actions = [];

        closeUserSettingsDropdown();

        $isLoading = false;
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };
</script>

<PsButton
  { asLink }
  style="secondary"
  onDark
  on:click={ logout }
>
  Log out
</PsButton>
