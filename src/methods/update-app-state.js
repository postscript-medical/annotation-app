import { protectedContent } from "../stores";

export default async function updateAppState({
  id,
  selectedIllustrationTitle,
  selectedSpecialty,
  selectedSubSpecialty,
  user,
}) {
  const token = user ? await user.jwt() : false;

  if (!token) {
    return Promise.reject(
      new Error("Could not validate your token. Please contact support.")
    );
  }

  await fetch("/.netlify/functions/update-app-state", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id,
      selectedIllustrationTitle,
      selectedSpecialty,
      selectedSubSpecialty,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("We have got back:", data);
      protectedContent.update((content) => {
        content.appState = data;

        return content;
      });
    })
    .catch((error) => console.error("::: Error updating app state :::", error));
}
