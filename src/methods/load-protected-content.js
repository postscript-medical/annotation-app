import "whatwg-fetch";
import { get } from "svelte/store";
import { protectedContent, session } from "../stores.js";
import { STORAGE_KEY } from "../constants/session.js";

export default async function () {
  // Get the current session from localStorage or store
  // Use get() because this is a regular JS file, not a Svelte component
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
      new Error("Could not validate your token. Please contact support.")
    );
  }

  try {
    const response = await fetch("/.netlify/functions/get-protected-content", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response || !response.ok) {
      // If token is expired, try to refresh it
      if (response.status === 401 && currentSession.refresh_token) {
        try {
          const refreshResponse = await fetch(
            "/.netlify/functions/auth-refresh",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh_token: currentSession.refresh_token,
              }),
            }
          );

          if (refreshResponse.ok) {
            const newSession = await refreshResponse.json();
            // Store the new session
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(newSession)
            );
            // Update the session store
            session.set(newSession);

            // Retry the protected content request with the new token
            const retryResponse = await fetch(
              "/.netlify/functions/get-protected-content",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${newSession.access_token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            const retryData = await retryResponse.json();

            if (!retryResponse || !retryResponse.ok) {
              throw new Error(
                retryData.error || "Failed to load protected content"
              );
            }

            // Process the successful response
            processProtectedContent(retryData);
            return;
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Clear the session if refresh fails
          window.localStorage.removeItem(STORAGE_KEY);
          session.set(null);
        }
      }

      throw new Error(data.error || "Failed to load protected content");
    }

    // Process the successful response
    processProtectedContent(data);
  } catch (error) {
    console.log("Load error:", error);
    throw new Error(error.message || "Failed to load protected content");
  }
}

function processProtectedContent(data) {
  /**
   * Supabase will return an error object if the user requested does not exist.
   */
  if (data.error) {
    throw new Error(data.error);
  }

  if (data.specialties) {
    // Check if user has chosen a specialty by looking at the specialty object
    const hasChosenSpecialty =
      data.appState.specialty && data.appState.specialty.id;

    if (!hasChosenSpecialty) {
      // User hasn't chosen a specialty yet - don't set defaults
      // The modal will handle the specialty selection
      data.appState.selectedSpecialty = null;
      data.appState.selectedSubSpecialty = null;
      data.appState.selected_specialty_id = null;
      data.appState.selected_sub_specialty_id = null;
      data.appState.selected_illustration_id = null;
    } else {
      // User has chosen a specialty - set the values from the database objects
      // Add null checks to prevent errors if specialty/subSpecialty/illustration are null
      if (data.appState.specialty) {
        data.appState.selectedSpecialty = data.appState.specialty.name;
        data.appState.selected_specialty_id = data.appState.specialty.id;
      }
      if (data.appState.subSpecialty) {
        data.appState.selectedSubSpecialty = data.appState.subSpecialty.name;
        data.appState.selected_sub_specialty_id = data.appState.subSpecialty.id;
      }
      if (data.appState.illustration) {
        data.appState.selected_illustration_id = data.appState.illustration.id;
      }
    }
  }

  // Set the selectedIllustrationTitle from the loaded app state
  if (
    data.appState &&
    data.appState.illustration &&
    data.appState.illustration.name
  ) {
    data.appState.selectedIllustrationTitle = data.appState.illustration.name;
  }

  // Also set the illustration object directly for the selectedIllustration store
  if (
    data.appState &&
    data.appState.illustration &&
    data.appState.illustration.name
  ) {
    // Find the illustration in the specialties structure to get the full object
    for (const specialty of data.specialties || []) {
      for (const subSpecialty of specialty.subSpecialties || []) {
        const foundIllustration = subSpecialty.illustrations.find(
          (ill) => ill.name === data.appState.illustration.name
        );
        if (foundIllustration) {
          data.appState.illustration = foundIllustration;
          break;
        }
      }
      if (data.appState.illustration && data.appState.illustration.src) {
        break;
      }
    }
  }

  protectedContent.set(data);
}
