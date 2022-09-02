import "whatwg-fetch";

export default async function (url, user, params) {
  const token = user && user.jwt ? await user.jwt() : false;

  if (!token) {
    throw new Error("Could not validate your token. Please contact support.");
  }

  const response = await fetch(url, {
    method: params.method || "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: JSON.stringify(params.body || {}),
  }).catch((err) => {
    /* Not sure this is catching, need to investigate */
    console.log("[netlify-function] Catching error:", err);
    throw new Error(`Server Error - ${err.message}`);
  });

  if (response.ok) {
    return response;
  }

  const error = await response.json();

  throw new Error(`Server error - ${error.message}`);
}
