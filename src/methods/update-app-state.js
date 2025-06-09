export default async function updateAppState({
  id,
  illustrationId,
  specialtyId,
  subSpecialtyId,
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
      illustrationId,
      specialtyId,
      subSpecialtyId,
    }),
  }).catch((error) => console.error("::: Error updating app state :::", error));
}
