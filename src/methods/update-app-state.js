import { get } from "svelte/store";
import { session } from "../stores.js";
import { STORAGE_KEY } from "../constants/session.js";

export default async function updateAppState({
  id,
  illustrationTitle,
  illustrationId,
  specialtyName,
  specialtyId,
  subSpecialtyName,
  subSpecialtyId,
}) {
  // Get the current session from store or localStorage
  let currentSession = get(session);

  if (!currentSession) {
    const sessionData = window.localStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      try {
        currentSession = JSON.parse(sessionData);
      } catch (error) {
        console.error("Error parsing session from localStorage:", error);
        return Promise.reject(
          new Error("Could not validate your session. Please log in again.")
        );
      }
    }
  }

  const token = currentSession ? currentSession.access_token : false;

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
