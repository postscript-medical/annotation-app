import {
  actions,
  illustrationSearchQuery,
  illustrationLoaded,
  protectedContent,
  selectedIllustrationTitle,
  selectedSpecialty,
  selectedSubSpecialty,
  user,
} from "../stores.js";
import {
  DEFAULT_SELECTED_SPECIALTY,
  DEFAULT_SELECTED_SUB_SPECIALTY,
} from "../constants/defaults.js";
import { STORAGE_KEY } from "../constants/session.js";
import closeUserSettingsDropdown from "./close-user-settings-dropdown.js";

export default function clearLocalApplicationData() {
  actions.set();
  illustrationSearchQuery.set("");
  illustrationLoaded.set(false);
  protectedContent.set(null);
  selectedIllustrationTitle.set(null);
  selectedSpecialty.set(DEFAULT_SELECTED_SPECIALTY);
  selectedSubSpecialty.set(DEFAULT_SELECTED_SUB_SPECIALTY);
  user.set(null);

  closeUserSettingsDropdown();

  window.sessionStorage.removeItem(STORAGE_KEY);
}
