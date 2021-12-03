import "whatwg-fetch";
import { derived, readable, writable, get } from "svelte/store";
import {
  DEFAULT_SELECTED_SPECIALTY,
  DEFAULT_SELECTED_SUB_SPECIALTY,
  TOOL_TEXT,
  VIEWPORT_PHONE,
  VIEWPORT_TABLET,
  VIEWPORT_LAPTOP,
  VIEWPORT_WIDESCREEN,
} from "./constants/defaults.js";

export const activeModal = writable("");

export const session = writable();

export const user = writable();

export const isLoading = writable(true);

export const protectedContent = writable();

export const viewportType = readable(VIEWPORT_PHONE, (set) => {
  const mediaQueryPhone = window.matchMedia("(max-width: 599px");
  const mediaQueryTablet = window.matchMedia(
    "(min-width: 600px) and (max-width: 899px)"
  );
  const mediaQueryLaptop = window.matchMedia(
    "(min-width: 900px) and (max-width: 1199px)"
  );
  const mediaQueryWideScreen = window.matchMedia("(min-width: 1200px)");
  const hasEventListenerType = mediaQueryPhone.addEventListener;

  function phoneQueryChange({ matches }) {
    if (matches) set(VIEWPORT_PHONE);
  }

  function tabletQueryChange({ matches }) {
    if (matches) set(VIEWPORT_TABLET);
  }

  function laptopQueryChange({ matches }) {
    if (matches) set(VIEWPORT_LAPTOP);
  }

  function widescreenQueryChange({ matches }) {
    if (matches) set(VIEWPORT_WIDESCREEN);
  }

  /* iOS does not seem to currently support 'addEventListener' */
  hasEventListenerType
    ? mediaQueryPhone.addEventListener("change", phoneQueryChange)
    : mediaQueryPhone.addListener(phoneQueryChange);
  hasEventListenerType
    ? mediaQueryTablet.addEventListener("change", tabletQueryChange)
    : mediaQueryTablet.addListener(tabletQueryChange);
  hasEventListenerType
    ? mediaQueryLaptop.addEventListener("change", laptopQueryChange)
    : mediaQueryLaptop.addListener(laptopQueryChange);
  hasEventListenerType
    ? mediaQueryWideScreen.addEventListener("change", widescreenQueryChange)
    : mediaQueryWideScreen.addListener(widescreenQueryChange);

  phoneQueryChange(mediaQueryPhone);
  tabletQueryChange(mediaQueryTablet);
  laptopQueryChange(mediaQueryLaptop);
  widescreenQueryChange(mediaQueryWideScreen);

  return () => {
    hasEventListenerType
      ? mediaQueryPhone.removeEventListener("change", phoneQueryChange)
      : mediaQueryPhone.removeListener(phoneQueryChange);
    hasEventListenerType
      ? mediaQueryTablet.removeEventListener("change", tabletQueryChange)
      : mediaQueryTablet.removeListener(tabletQueryChange);
    hasEventListenerType
      ? mediaQueryLaptop.removeEventListener("change", laptopQueryChange)
      : mediaQueryLaptop.removeListener(laptopQueryChange);
    hasEventListenerType
      ? mediaQueryWideScreen.removeEventListener(
          "change",
          widescreenQueryChange
        )
      : mediaQueryWideScreen.removeListener(widescreenQueryChange);
  };
});

export const organization = derived(
  protectedContent,
  ($protectedContent) =>
    $protectedContent && $protectedContent.team.organization
);

/**
 * Header-related stores
 */
export const userSettingsDropdownDrawerOpen = writable(false);

export const customerPortalUrl = derived(
  [user, organization],
  ([$user, $organization], set) => {
    if (!$user || !$organization) return;

    fetch("/.netlify/functions/create-manage-link", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${$user.token.access_token}`,
      },
      body: JSON.stringify({
        stripeID: $organization.stripeID,
      }),
    })
      .then((response) => response.json())
      .then((link) => {
        set(link);
      });
  },
  "#"
);

/**
 * Canvas-related stores
 */
export const actions = (function () {
  /**
   * Adapted from Rich Harris svelte-undo
   * & lihautan Undo/Redo with Svelte store video
   */
  const stack = [];

  let index = stack.length;

  const state = writable({
    first: true,
    last: true,
    current: stack,
    stack,
    index,
  });

  function update() {
    const current = stack[index - 1];

    state.set({
      first: index === 1,
      last: index === stack.length,
      current: current || [],
      stack,
      index,
    });
  }

  return {
    jumpTo: (newIndex) => {
      if (newIndex > 0 && newIndex < stack.length) index = newIndex;

      update();
    },
    push: (value) => {
      stack.length = index;
      stack[index++] = value;

      update();
    },
    redo: () => {
      if (index < stack.length) index += 1;

      update();
    },
    set: (value) => {
      stack.length = 0;

      if (value) {
        stack.push(value);
      }

      index = stack.length;

      update();
    },
    subscribe: state.subscribe,
    undo: () => {
      if (index > 1) index -= 1;

      update();
    },
    update: (value) => {
      stack.length = index;
      stack[index - 1] = value;

      update();
    },
  };
})();

export const canvasElement = writable();

export const context = writable();

export const dpr = readable(1, (set) => {
  let pixelRatio = (window.devicePixelRatio || 1, 2);

  set(pixelRatio);

  return () => {};
});

export const toolDrawerOpen = writable("");

export const typedTextEntries = derived(actions, ($actions) =>
  $actions.current.filter(({ name }) => name === TOOL_TEXT)
);

/**
 * Illustrations-related stores
 */
export const annotatedImage = writable();

export const illustrationSearchQuery = writable("");

export const illustrationLoaded = writable(false);

export const illustrationDisplayed = writable();

export const selectedIllustrationTitle = writable("");

export const selectedSpecialty = writable(DEFAULT_SELECTED_SPECIALTY);

export const selectedSubSpecialty = writable(DEFAULT_SELECTED_SUB_SPECIALTY);

export const specialties = derived(protectedContent, ($protectedContent) => {
  return $protectedContent ? $protectedContent.team.specialties : false;
});

export const subSpecialties = derived(
  [selectedSpecialty, specialties],
  ([$selectedSpecialty, $specialties]) => {
    if (!$specialties || $specialties.length === 0) return [];

    const selectedSpecialty = $specialties.find(
      ({ name }) => name.toLowerCase() === $selectedSpecialty.toLowerCase()
    );
    const subSpecialties = JSON.parse(
      JSON.stringify(selectedSpecialty.subSpecialties)
    );

    if (!subSpecialties || subSpecialties.length === 0) return [];

    const allIllustrations = JSON.parse(
      JSON.stringify(
        subSpecialties.flatMap(({ illustrations }) => illustrations)
      )
    );
    /**
     * Filter out duplicates
     */
    const dedupedIllustrations = allIllustrations.filter(
      (illustration, index, self) => {
        return (
          index ===
          self.findIndex((entry) => {
            return entry.src === illustration.src;
          })
        );
      }
    );

    const allSubSpecialty = {
      name: "All",
      illustrations: dedupedIllustrations,
    };

    subSpecialties.push(allSubSpecialty);

    return subSpecialties;
  }
);

export const illustrations = derived(
  [subSpecialties, selectedSubSpecialty],
  ([$subSpecialties, $selectedSubSpecialty]) => {
    const subSpecialty =
      $subSpecialties &&
      $subSpecialties.find(
        ({ name }) => name.toLowerCase() === $selectedSubSpecialty.toLowerCase()
      );

    return subSpecialty ? subSpecialty.illustrations : [];
  }
);

export const filteredIllustrations = derived(
  [illustrations, illustrationSearchQuery],
  ([$illustrations, $illustrationSearchQuery]) => {
    const filtered = $illustrationSearchQuery
      ? $illustrations.filter(({ name, alias }) => {
          return (
            name
              .toLowerCase()
              .includes($illustrationSearchQuery.toLowerCase()) ||
            alias.find((entry) =>
              entry
                .toLowerCase()
                .includes($illustrationSearchQuery.toLowerCase())
            )
          );
        })
      : $illustrations;

    const sorted = JSON.parse(JSON.stringify(filtered));

    sorted.sort((el1, el2) => {
      const name1 = el1.name.toLowerCase();
      const name2 = el2.name.toLowerCase();

      if (name1 < name2) return -1;
      if (name1 > name2) return 1;

      return 0;
    });

    return sorted;
  }
);

export const selectedIllustration = derived(
  [selectedIllustrationTitle],
  ([$selectedIllustrationTitle]) => {
    const _illustrations = get(illustrations);

    let _illustration;

    if ($selectedIllustrationTitle) {
      _illustration =
        _illustrations &&
        _illustrations.find(
          ({ name }) =>
            name.toLowerCase() === $selectedIllustrationTitle.toLowerCase()
        );
    } else {
      _illustration =
        _illustrations &&
        _illustrations.find(({ default_illustration }) => default_illustration);
    }

    return _illustration
      ? {
          ..._illustration,
          src: "images/annotation-app/illustrations/" + _illustration.src,
        }
      : undefined;
  }
);
