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
    // Only set default values if user hasn't actually chosen a specialty
    // Check if selected_specialty_id exists in the app state (from database)
    const hasChosenSpecialty = data.appState.selected_specialty_id;

    if (!hasChosenSpecialty) {
      // User hasn't chosen a specialty yet - don't set defaults
      // The modal will handle the specialty selection
      data.appState.selectedSpecialty = null;
      data.appState.selectedSubSpecialty = null;
    } else {
      // User has chosen a specialty - set the values from the database
      if (!data.appState.selectedSpecialty) {
        data.appState.selectedSpecialty = data.specialties[0].name;
      }

      if (!data.appState.selectedSubSpecialty) {
        data.appState.selectedSubSpecialty =
          data.specialties[0].subSpecialties[0].name;
      }
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
