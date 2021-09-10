import "whatwg-fetch";

export default async function (user) {
  const token = user ? await user.jwt(true) : false;

  if (!token) {
    return Promise.reject(
      new Error("Could not validate your token. Please contact support.")
    );
  }

  const request = await fetch("/.netlify/functions/get-specialties", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch((error) => {
    console.error("::: Error getting specialties :::", error);
    error = true;
  });

  return request;
}
