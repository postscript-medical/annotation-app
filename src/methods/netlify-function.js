import "whatwg-fetch";

export default async function (url, user, params) {
  const token = user ? await user.jwt() : false;

  if (!token) {
    return Promise.reject(
      new Error("Could not validate your token. Please contact support.")
    );
  }

  const response = await fetch(url, {
    method: params.method || "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: JSON.stringify(params.body || {}),
  }).catch((err) => Promise.reject(new Error(`Error ${err.message}`)));

  if (!response || !response.ok) {
    const err = await response.json();

    return Promise.reject(new Error(err.message));
  }

  return response;
}
