import { derived, readable, writable } from 'svelte/store';
import {
  TOOL_TEXT,
  VIEWPORT_PHONE,
  VIEWPORT_TABLET,
  VIEWPORT_LAPTOP,
  VIEWPORT_WIDESCREEN
} from './constants/defaults.js';

export const session = writable();

// Investigate: We want to reactively trigger a loadProtectedContent when the user is updated > use derived stores
export const user = writable();

export const isLoading = writable(true);

export const protectedContent = writable();

export const viewportType = readable(VIEWPORT_PHONE, set => {
  const mediaQueryPhone = window.matchMedia('(max-width: 599px');
  const mediaQueryTablet = window.matchMedia('(min-width: 600px) and (max-width: 899px)');
  const mediaQueryLaptop = window.matchMedia('(min-width: 900px) and (max-width: 1199px)');
  const mediaQueryWideScreen = window.matchMedia('(min-width: 1200px)');
  const hasEventListenerType = mediaQueryPhone.addEventListener;

  function phoneQueryChange ({ matches }) {
    if (matches) set(VIEWPORT_PHONE);
  };

  function tabletQueryChange ({ matches }) {
    if (matches) set(VIEWPORT_TABLET);
  };
  
  function laptopQueryChange ({ matches }) {
    if (matches) set(VIEWPORT_LAPTOP);
  };
  
  function widescreenQueryChange ({ matches }) {
    if (matches) set(VIEWPORT_WIDESCREEN);
  };

  /* iOS does not seem to currently support 'addEventListener' */
  hasEventListenerType ? mediaQueryPhone.addEventListener('change', phoneQueryChange) : mediaQueryPhone.addListener(phoneQueryChange) ;
  hasEventListenerType ? mediaQueryTablet.addEventListener('change', tabletQueryChange) : mediaQueryTablet.addListener(tabletQueryChange) ;
  hasEventListenerType ? mediaQueryLaptop.addEventListener('change', laptopQueryChange) : mediaQueryLaptop.addListener(laptopQueryChange) ;
  hasEventListenerType ? mediaQueryWideScreen.addEventListener('change', widescreenQueryChange) : mediaQueryWideScreen.addListener(widescreenQueryChange) ;

  phoneQueryChange(mediaQueryPhone);
  tabletQueryChange(mediaQueryTablet);
  laptopQueryChange(mediaQueryLaptop);
  widescreenQueryChange(mediaQueryWideScreen);

  return () => {
    hasEventListenerType ? mediaQueryPhone.removeEventListener('change', phoneQueryChange) : mediaQueryPhone.removeListener(phoneQueryChange);
    hasEventListenerType ? mediaQueryTablet.removeEventListener('change', tabletQueryChange) : mediaQueryTablet.removeListener(tabletQueryChange);
    hasEventListenerType ? mediaQueryLaptop.removeEventListener('change', laptopQueryChange) : mediaQueryLaptop.removeListener(laptopQueryChange);
    hasEventListenerType ? mediaQueryWideScreen.removeEventListener('change', widescreenQueryChange) : mediaQueryWideScreen.removeListener(widescreenQueryChange);
  }
});

/**
 * Header-related stores
 */
export const userSettingsDropdownDrawerOpen = writable(false);

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

export const dpr = readable(1, set => {
  let pixelRatio = window.devicePixelRatio || 1;
  pixelRatio = pixelRatio < 1 ? 1 : pixelRatio;

  set(pixelRatio);

  return () => {};
});

export const toolDrawerOpen = writable('');

export const typedTextEntries = derived(
  actions,
  $actions => $actions.filter(({ name }) => name === TOOL_TEXT)
);


/**
 * Illustrations-related stores
 */
export const selectedIllustrationTitle = writable();

export const illustrationSearchQuery = writable('');

export const illustrationLoaded = writable(false);

export const illustrationDisplayed = writable();

export const selectedSpecialty = writable();

export const selectedSubSpecialty = writable();

export const specialties = derived(
  protectedContent,
  $protectedContent => $protectedContent ? $protectedContent.subscription.specialties : ''
);

export const subSpecialties = derived(
  protectedContent,
  $protectedContent => $protectedContent ? $protectedContent.subscription.subSpecialties : ''
);

export const illustrations = derived(
  protectedContent,
  $protectedContent => $protectedContent ? $protectedContent.subscription.images : [] /* probably rename the property to illustrations as well */
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
    illustrations,
    illustrationsPath,
    selectedIllustrationTitle
  ],
  ([
    $illustrations,
    $illustrationsPath,
    $selectedIllustrationTitle
  ]) => {
    const illustration = $illustrations.find(({ title }) => title === $selectedIllustrationTitle)

    return illustration
    ? {
        ...illustration,
        src: $illustrationsPath + illustration.src
      }
    : undefined
  }
);