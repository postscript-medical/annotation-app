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

  const response = await fetch("/.netlify/functions/get-protected-content-2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response || !response.ok) {
    // TODO: clear session storage whenever we hit this error
    throw new Error(
      `An error when fetching protected content:\n${response.status}`
    );
  }

  const data = await response.json();

  /**
   * Netlify identity will return:
   * { copy: 'Not allowed' }
   * whenever if the user requested does not exist.
   */
  if (data.copy) {
    // TODO: show error that no user could be found
    return;
  }

  console.log("Protected content:", data);

  protectedContent.set(data);
  selectedIllustrationTitle.set(data.appState.selectedIllustrationTitle);
  selectedSpecialty.set(data.appState.selectedSpecialty);
  selectedSubSpecialty.set(data.appState.selectedSubSpecialty);
}
