import { derived, writable } from 'svelte/store';
import { TOOL_TEXT } from './constants/sketch-pad';

export const session = writable();

// Investigate: We want to reactively trigger a loadProtectedContent when the user is updated
export const user = writable();

export const isLoading = writable(true);

export const protectedContent = writable();

/**
 * Header-related stores
 */
export const openDrawer = writable(false);

export const openShareModal = writable(false);

export const customerPortalUrl = derived(
  user, 
  ($user, set) => {
    if (!$user) return;

    fetch('/.netlify/functions/create-manage-link', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${$user.token.access_token}`,
      },
    })
    .then(response => response.json())
    .then(link => {
      set(link);
    })
  },
  '#'
);

/**
 * Canvas-related stores
 */
export const actions = writable([]);

export const canvas = writable();

export const context = writable();

export const typedTextEntries = derived(
  actions,
  $actions => $actions.filter(({ name }) => name === TOOL_TEXT)
);


/**
 * Illustrations-related stores
 */
export const selectedImageTitle = writable();

export const illustrationSearchQuery = writable('');

export const selectedSpecialty = writable();

export const selectedSubSpecialty = writable();

export const specialties = derived(
  protectedContent,
  $protectedContent => $protectedContent.specialties
);

export const subSpecialties = derived(
  protectedContent,
  $protectedContent => $protectedContent.subSpecialties
);

export const illustrations = derived(
  protectedContent,
  $protectedContent => $protectedContent ? $protectedContent.images : [] /* probably rename the property to illustrations as well */
);

const redirectPath = 'images';
const imageSize = '1920x1080'
export const illustrationsPath = derived(
  selectedSpecialty,
  $selectedSpecialty => $selectedSpecialty ? `${redirectPath}/postscript-medical/annotation-app/illustrations/${$selectedSpecialty.toLowerCase()}/${imageSize}/` : ''
);

export const preFilteredIllustrations = derived(
  [
    illustrations,
    selectedSpecialty,
    selectedSubSpecialty
  ],
  ([
    $illustrations,
    $selectedSpecialty,
    $selectedSubSpecialty
  ]) => $illustrations
    .filter(({ specialties }) => specialties
      .filter(specialty => specialty.toLowerCase() === $selectedSpecialty.toLowerCase())
    )
    .filter(({ subSpecialties }) => subSpecialties
      .filter(subSpecialty => subSpecialty.toLowerCase() === $selectedSubSpecialty.toLowerCase())
    )
);

export const filteredIllustrations = derived(
  [
    preFilteredIllustrations,
    illustrationSearchQuery
  ],
  ([
    $preFilteredIllustrations,
    $illustrationSearchQuery
  ]) => $illustrationSearchQuery
    ? $preFilteredIllustrations.filter(({ title }) => title.toLowerCase().includes($illustrationSearchQuery.toLowerCase()))
    : $preFilteredIllustrations
);

export const selectedIllustration = derived(
  [
    filteredIllustrations,
    selectedImageTitle
  ],
  ([
    $filteredIllustrations,
    $selectedImageTitle
  ]) => $filteredIllustrations.find(({ title }) => title === $selectedImageTitle)
);