import { userSettingsDropdownDrawerOpen } from '../stores';

export default function closeUserSettingsDropdown () {
  userSettingsDropdownDrawerOpen.set(false);
}