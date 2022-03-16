<script>
  /*global emailjs*/
  import GoTrue from "gotrue-js";
  import { wrap } from "svelte-spa-router/wrap";
  import Router, { push } from "svelte-spa-router";
  import { user, isLoading, session, protectedContent } from "./stores";
  import { STORAGE_KEY } from "./constants/session.js";
  import clearLocalApplicationData from "./methods/clear-local-application-data.js";
  import loadProtectedContent from "./methods/load-protected-content.js";
  import AdminPanel from "./screens/AdminPanel.svelte";
  import AdminIllustrations from "./screens/AdminIllustrations.svelte";
  import AdminSubSpecialties from "./screens/AdminSubSpecialties.svelte";
  import ConfirmSignUp from "./screens/ConfirmSignUp.svelte";
  import ErrorModal from "./modals/ErrorModal.svelte";
  import Index from "./screens/Index.svelte";
  import ImageAnnotation from "./screens/ImageAnnotation.svelte";
  import InactiveAccount from "./screens/InactiveAccount.svelte";
  import LoadingOverlay from "./components/LoadingOverlay.svelte";
  import ManageTeam from "./screens/ManageTeam.svelte";
  import NotFound from "./screens/NotFound.svelte";
  import SignUp from "./screens/SignUp.svelte";
  import SignUpSuccess from "./screens/SignUpSuccess.svelte";

  let hasAuthenticated = false;
  let errorMessage = "";

  const routes = {
    "/": wrap({
      component: Index,
      conditions: [
        async () => {
          if (!hasAuthenticated) await initAuthentication();

          if (!$user) return confirmNavigation();

          return redirectTo("#/annotate");
        },
      ],
    }),
    "/admin": wrap({
      component: AdminPanel,
      conditions: [isUserLoggedIn, isUserDm],
    }),
    "/admin/illustrations": wrap({
      component: AdminIllustrations,
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
    "/confirm-signup": wrap({
      component: ConfirmSignUp,
      conditions: [
        async ({ querystring }) => {
          if (!hasAuthenticated) await initAuthentication();

          const searchParams = new URLSearchParams(querystring);
          const token = searchParams.get("token");

          if (token) {
            return confirmNavigation();
          }

          redirectTo("#/");
        },
      ],
    }),
    "/inactive-account": wrap({
      component: InactiveAccount,
      conditions: [isUserLoggedIn],
    }),
    "/manage-team": wrap({
      component: ManageTeam,
      conditions: [isUserLoggedIn],
    }),
    "/sign-up": wrap({
      component: SignUp,
      conditions: [
        async () => {
          if (!hasAuthenticated) await initAuthentication();

          return confirmNavigation();
        },
      ],
    }),
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

  async function getUserFromSessionStorage() {
    const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (!sessionStorage) return false;

    const { email, password } = JSON.parse(sessionStorage);

    try {
      const user = await $session.login(email, password);

      return user;
    } catch (err) {
      window.sessionStorage.removeItem(STORAGE_KEY);

      $isLoading = false;

      return false;
    }
  }

  async function initAuthentication() {
    $isLoading = true;

    const response = await new GoTrue({
      APIUrl: "/.netlify/identity",
      setCookie: true,
    });

    if (!response) {
      $isLoading = false;

      return true;
    }

    $session = response;

    $user = await (getUserFromSessionStorage() || $session.currentUser());

    emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");

    hasAuthenticated = true;
  }

  function isUserDm() {
    if ($protectedContent && $protectedContent.role === "dm") {
      return confirmNavigation();
    }

    return redirectTo("#/");
  }

  async function isUserLoggedIn() {
    if (!hasAuthenticated) await initAuthentication();

    $isLoading = true;

    if ($user) {
      await loadProtectedContent($user).catch(async function (error) {
        await $user.logout().catch((err) => {
          errorMessage = err;
        });

        clearLocalApplicationData();

        errorMessage = error;

        redirectTo("#/");
      });

      if ($protectedContent) {
        return confirmNavigation();
      }
    }

    return redirectTo("#/");
  }

  function isSubscriptionValid() {
    if (!$protectedContent) {
      return redirectTo("#/");
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
