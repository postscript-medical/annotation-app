<script>
  import { push } from "svelte-spa-router";
  import {
    DEFAULT_SELECTED_SPECIALTY,
    DEFAULT_SELECTED_SUB_SPECIALTY,
  } from "../constants/defaults.js";
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
  } from "../stores.js";
  import { STORAGE_KEY } from "../constants/session.js";
  import closeUserSettingsDropdown from "../methods/closeUserSettingsDropdown.js";
  import PsButton from "./PsButton.svelte";

  export let inline = false;

  function logout() {
    isLoading.set(true);

    $user
      .logout()
      .then(() => {
        clearLocalApplicationData();

        push("/");

        isLoading.set(false);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function clearLocalApplicationData() {
    actions.set();
    protectedContent.set(null);
    illustrationSearchQuery.set("");
    illustrationLoaded.set(false);
    selectedIllustrationTitle.set(null);
    selectedSpecialty.set(DEFAULT_SELECTED_SPECIALTY);
    selectedSubSpecialty.set(DEFAULT_SELECTED_SUB_SPECIALTY);
    user.set(null);

    closeUserSettingsDropdown();

    window.sessionStorage.removeItem(STORAGE_KEY);
  }
</script>

<PsButton
  style={`secondary on-dark ${inline ? "inline" : ""}`}
  on:click={logout}
>
  Log out
</PsButton>
