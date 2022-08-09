import "whatwg-fetch";
import {
  protectedContent,
  selectedSpecialty,
  selectedSubSpecialty,
  selectedIllustrationTitle,
} from "../stores.js";

export default async function (user) {
  const token = user ? await user.jwt(true) : false;

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

  const state = data.appState;
  const illustration = state.selectedIllustrationTitle || "Graph";
  let specialty = "";
  let subSpecialy = "";

  if (data.organization.subscriptionLevel !== "inactive") {
    specialty = state.selectedSpecialty
      ? state.selectedSpecialty
      : data.specialties[0].name;
    subSpecialy = state.selectedSubSpecialty
      ? state.selectedSubSpecialty
      : data.specialties[0].subSpecialties[0].name;
  }

  protectedContent.set(data);
  selectedIllustrationTitle.set(illustration);
  selectedSpecialty.set(specialty);
  selectedSubSpecialty.set(subSpecialy);
}
