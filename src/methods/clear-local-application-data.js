import {
  actions,
  illustrationSearchQuery,
  illustrationLoaded,
  protectedContent,
  user,
} from "../stores.js";
import { STORAGE_KEY } from "../constants/session.js";
import closeUserSettingsDropdown from "./close-user-settings-dropdown.js";

export default function clearLocalApplicationData() {
  actions.set();
  illustrationSearchQuery.set("");
  illustrationLoaded.set(false);
  protectedContent.set(null);
  user.set(null);

  closeUserSettingsDropdown();

  window.sessionStorage.removeItem(STORAGE_KEY);
}
