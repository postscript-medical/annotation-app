import { UPDATE_APP_STATE_URL } from "../constants/api.js";

export default async function updateAppState({
  id,
  illustrationTitle,
  specialtyName,
  subSpecialtyName,
  user,
}) {
  const token = user ? await user.jwt() : false;

  if (!token) {
    return Promise.reject(
      Error("Could not validate your token. Please contact support.")
    );
  }

  await fetch(UPDATE_APP_STATE_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id,
      illustrationTitle,
      specialtyName,
      subSpecialtyName,
    }),
  }).catch((error) => console.error("::: Error updating app state :::", error));
}
