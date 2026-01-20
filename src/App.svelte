<script>
  import { wrap } from "svelte-spa-router/wrap";
  import Router, { push } from "svelte-spa-router";
  import { user, isLoading, session, protectedContent } from "./stores";
  import { STORAGE_KEY } from "./constants/session.js";
  import clearLocalApplicationData from "./methods/clear-local-application-data.js";
  import loadProtectedContent from "./methods/load-protected-content.js";
  import AcceptTeamInvitation from "./screens/AcceptTeamInvitation.svelte";
  import AdminPanel from "./screens/AdminPanel.svelte";
  import AdminIllustrations from "./screens/AdminIllustrations.svelte";
  import AdminManageOrganizations from "./screens/AdminManageOrganizations.svelte";
  import AdminSubSpecialties from "./screens/AdminSubSpecialties.svelte";
  import ConfirmSignUp from "./screens/ConfirmSignUp.svelte";
  import DrFalk from "./screens/DrFalk.svelte";
  import ErrorModal from "./modals/ErrorModal.svelte";
  import Index from "./screens/Index.svelte";
  import ImageAnnotation from "./screens/ImageAnnotation.svelte";
  import InactiveAccount from "./screens/InactiveAccount.svelte";
  import LoadingOverlay from "./components/LoadingOverlay.svelte";
  import LogOut from "./screens/LogOut.svelte";
  import ManageTeam from "./screens/ManageTeam.svelte";
  import NotFound from "./screens/NotFound.svelte";
  import ResetPassword from "./screens/ResetPassword.svelte";
  import SignUp from "./screens/SignUp.svelte";
  import SignUpSuccess from "./screens/SignUpSuccess.svelte";

  import { accept_team_invitation } from "./constants/urls";

  let hasAuthenticated = false;
  let errorMessage = "";

  // Reactive statement: if session has user but user store is null, set it
  $: if ($session && $session.user && !$user) {
    $user = $session.user;
  }

  const routes = {
    "/": wrap({
      component: Index,
      conditions: [
        async () => {
          if (!hasAuthenticated) await initAuthentication();

          return confirmNavigation();
        },
      ],
    }),
    [`/${accept_team_invitation}`]: wrap({
      component: AcceptTeamInvitation,
      conditions: [hasToken],
    }),
    "/admin": wrap({
      component: AdminPanel,
      conditions: [isUserLoggedIn, isUserDm],
    }),
    "/admin/illustrations": wrap({
      component: AdminIllustrations,
      conditions: [isUserLoggedIn, isUserDm],
    }),
    "/admin/organizations": wrap({
      component: AdminManageOrganizations,
      conditions: [isUserLoggedIn, isUserDm],
    }),
    "/admin/sub-specialties": wrap({
      component: AdminSubSpecialties,
      conditions: [isUserLoggedIn, isUserDm],
    }),
    "/annotate": wrap({
      component: ImageAnnotation,
      conditions: [isUserLoggedIn, isSubscriptionValid],
    }),
    "/confirm-sign-up": wrap({
      component: ConfirmSignUp,
      conditions: [hasToken],
    }),
    "/dr-falk": wrap({
      component: DrFalk,
      conditions: [
        async () => {
          if (!hasAuthenticated) await initAuthentication();

          return confirmNavigation();
        },
      ],
    }),
    "/inactive-account": wrap({
      component: InactiveAccount,
      conditions: [isUserLoggedIn],
    }),
    "/log-out": wrap({
      component: LogOut,
    }),
    "/manage-team": wrap({
      component: ManageTeam,
      conditions: [isUserLoggedIn],
    }),
    "/reset-password": wrap({
      component: ResetPassword,
      conditions: [hasToken],
    }),
    // "/sign-up": wrap({
    //   component: SignUp,
    //   conditions: [
    //     async () => {
    //       if (!hasAuthenticated) await initAuthentication();

    //       return confirmNavigation();
    //     },
    //   ],
    // }),
    "/success": wrap({
      component: SignUpSuccess,
      conditions: [
        async () => {
          if (!hasAuthenticated) await initAuthentication();

          if ($user) {
            return redirectTo("#/annotate");
          }

          return confirmNavigation();
        },
      ],
    }),
    "*": wrap({
      component: NotFound,
    }),
  };

  function confirmNavigation() {
    $isLoading = false;

    return true;
  }

  function getUserFromSessionStorage() {
    const sessionData = window.localStorage.getItem(STORAGE_KEY);

    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);

      // Check if session has required fields
      if (!session.access_token || !session.user) {
        window.localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      // Check if token is expired
      if (session.expires_at && Date.now() >= session.expires_at * 1000) {
        // Token is expired, but we might still be able to refresh it
        return session;
      }

      return session;
    } catch (err) {
      console.error("Error parsing session from localStorage:", err);
      window.localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }

  async function hasToken({ querystring }) {
    if (!hasAuthenticated) await initAuthentication();

    const searchParams = new URLSearchParams(querystring);
    const token = searchParams.get("token");

    if (token) {
      return confirmNavigation();
    }

    return redirectTo("/");
  }

  async function initAuthentication() {
    $isLoading = true;

    try {
      // Check for existing Supabase session in localStorage
      const existingSession = getUserFromSessionStorage();

      if (existingSession) {
        // Validate the existing session with backend
        const response = await fetch("/.netlify/functions/auth/auth-session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${existingSession.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const sessionData = await response.json();
          // Use user from session data if available, otherwise use from existing session
          $user = sessionData.user || existingSession.user;
          $session = existingSession;
          hasAuthenticated = true;
          $isLoading = false;
          return true;
        } else {
          // Session is invalid, try to refresh if we have a refresh token
          if (existingSession.refresh_token) {
            const refreshResponse = await fetch(
              "/.netlify/functions/auth/auth-refresh",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refresh_token: existingSession.refresh_token,
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
              // Ensure user is set from the session
              $user = newSession.user;
              $session = newSession;
              hasAuthenticated = true;
              $isLoading = false;
              return true;
            }
          }

          // If refresh failed, clear the session
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      // No valid session found
      $isLoading = false;
      return true;
    } catch (error) {
      console.error("Authentication initialization error:", error);
      window.localStorage.removeItem(STORAGE_KEY);
      $isLoading = false;
      return true;
    }
  }

  function isUserDm() {
    if ($protectedContent && $protectedContent.role === "dm") {
      return confirmNavigation();
    }

    return redirectTo("/");
  }

  async function isUserLoggedIn() {
    if (!hasAuthenticated) await initAuthentication();

    $isLoading = true;

    if ($user) {
      await loadProtectedContent().catch(async function (error) {
        // Clear local data and redirect to login
        clearLocalApplicationData();

        errorMessage = error.message || "Session expired. Please log in again.";

        return redirectTo("/");
      });

      if ($protectedContent) {
        return confirmNavigation();
      }
    }

    return redirectTo("/");
  }

  function isSubscriptionValid() {
    if (!$protectedContent) {
      return redirectTo("/");
    }

    if ($protectedContent.organization.subscriptionLevel === "inactive") {
      return redirectTo("#/inactive-account");
    }

    return confirmNavigation();
  }

  function redirectTo(path) {
    push(path);

    $isLoading = false;

    return false;
  }

  function clearErrors() {
    errorMessage = "";
  }

  function handleRouteEvent({ detail }) {
    if (detail.errorMessage) {
      errorMessage = detail.errorMessage;
    }
  }
</script>

<Router {routes} on:routeEvent={handleRouteEvent} />

<div class="tooltip-container" />

{#if errorMessage}
  <ErrorModal on:close={clearErrors}>
    <p>{errorMessage}</p>
  </ErrorModal>
{/if}

<LoadingOverlay loading={$isLoading} />
