import "whatwg-fetch";
import { get } from "svelte/store";
import { session } from "../stores.js";
import { STORAGE_KEY } from "../constants/session.js";

export default async function (url, user, params) {
  // Get the current session from store or localStorage
  let currentSession = get(session);

  if (!currentSession) {
    const sessionData = window.localStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      try {
        currentSession = JSON.parse(sessionData);
      } catch (error) {
        console.error("Error parsing session from localStorage:", error);
        throw new Error(
          "Could not validate your session. Please log in again."
        );
      }
    }
  }

  const token = currentSession ? currentSession.access_token : false;

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
