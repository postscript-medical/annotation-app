import "whatwg-fetch";
import { protectedContent } from "../stores.js";

export default async function (user) {
  const token = user ? await user.jwt() : false;

  if (!token) {
    return Promise.reject(
      new Error("Could not validate your token. Please contact support.")
    );
  }

  const response = await fetch("/.netlify/functions/get-protected-content", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch((error) => {
    console.log("Load error:", error);
    throw new Error(error);
  });

  const data = await response.json();

  if (!response || !response.ok) {
    throw new Error(data.error);
  }

  /**
   * Netlify identity will return:
   * { copy: 'Not allowed' }
   * whenever if the user requested does not exist.
   */
  if (data.copy) {
    throw new Error(data.copy);
  }

  if (data.specialties) {
    // Check if user has chosen a specialty by looking at the specialty object
    const hasChosenSpecialty =
      data.appState.specialty && data.appState.specialty.id;

    if (!hasChosenSpecialty) {
      // User hasn't chosen a specialty yet - don't set defaults
      // The modal will handle the specialty selection
      data.appState.selectedSpecialty = null;
      data.appState.selectedSubSpecialty = null;
      data.appState.selected_specialty_id = null;
      data.appState.selected_sub_specialty_id = null;
      data.appState.selected_illustration_id = null;
    } else {
      // User has chosen a specialty - set the values from the database objects
      data.appState.selectedSpecialty = data.appState.specialty.name;
      data.appState.selectedSubSpecialty = data.appState.subSpecialty.name;
      data.appState.selected_specialty_id = data.appState.specialty.id;
      data.appState.selected_sub_specialty_id = data.appState.subSpecialty.id;
      data.appState.selected_illustration_id = data.appState.illustration.id;
    }
  }

  // Set the selectedIllustrationTitle from the loaded app state
  if (
    data.appState &&
    data.appState.illustration &&
    data.appState.illustration.name
  ) {
    data.appState.selectedIllustrationTitle = data.appState.illustration.name;
  }

  // Also set the illustration object directly for the selectedIllustration store
  if (
    data.appState &&
    data.appState.illustration &&
    data.appState.illustration.name
  ) {
    // Find the illustration in the specialties structure to get the full object
    for (const specialty of data.specialties || []) {
      for (const subSpecialty of specialty.subSpecialties || []) {
        const foundIllustration = subSpecialty.illustrations.find(
          (ill) => ill.name === data.appState.illustration.name
        );
        if (foundIllustration) {
          data.appState.illustration = foundIllustration;
          break;
        }
      }
      if (data.appState.illustration && data.appState.illustration.src) {
        break;
      }
    }
  }

  protectedContent.set(data);
}
