<script>
  import {
    DEFAULT_SELECTED_SPECIALTY,
    DEFAULT_SELECTED_SUB_SPECIALTY,
  } from '../constants/defaults.js';
  import {
    actions,
    isLoading,
    illustrationSearchQuery,
    illustrationLoaded,
    protectedContent,
    selectedIllustrationTitle,
    selectedSpecialty,
    selectedSubSpecialty,
    user,
  } from '../stores.js';
  import { STORAGE_KEY } from '../constants/session.js'
  import closeUserSettingsDropdown from '../methods/closeUserSettingsDropdown.js';
  import loadProtectedContent from '../methods/load-protected-content.js';
  import PsButton from './PsButton.svelte';

  export let inline = false;

  function logout () {
    $isLoading = true;

    $user
      .logout()
      .then(response => {

        clearLocalApplicationData();

        $isLoading = false;
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  function clearLocalApplicationData () {
    $actions = [];
    $protectedContent = null;
    $illustrationSearchQuery = '';
    $illustrationLoaded = false;
    $selectedIllustrationTitle = null;
    $selectedSpecialty = DEFAULT_SELECTED_SPECIALTY;
    $selectedSubSpecialty = DEFAULT_SELECTED_SUB_SPECIALTY;
    $user = null;

    closeUserSettingsDropdown();

    window.sessionStorage.removeItem(STORAGE_KEY);
  }
</script>

<PsButton
  style={ `secondary on-dark ${(inline ? 'inline' : '')}` }
  on:click={ logout }
>
  Log out
</PsButton>
