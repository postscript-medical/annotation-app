export default async function updateAppState({
  id,
  illustrationTitle,
  illustrationId,
  specialtyName,
  specialtyId,
  subSpecialtyName,
  subSpecialtyId,
  user,
}) {
  const token = user ? await user.jwt() : false;

  if (!token) {
    return Promise.reject(
      Error("Could not validate your token. Please contact support.")
    );
  }

  await fetch("/.netlify/functions/update-app-state", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id,
      illustrationTitle,
      illustrationId,
      specialtyName,
      specialtyId,
      subSpecialtyName,
      subSpecialtyId,
    }),
  }).catch((error) => console.error("::: Error updating app state :::", error));
}
