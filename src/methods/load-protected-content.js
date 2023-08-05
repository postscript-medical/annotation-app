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

  // if (data.appState.selectedSpecialty === "") {}

  protectedContent.set(data);
}
