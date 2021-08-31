/*global emailjs*/
import GoTrue from "gotrue-js";
import { wrap } from "svelte-spa-router/wrap";
import { push } from "svelte-spa-router";
import { user, isLoading, session, protectedContent } from "./stores";
import { STORAGE_KEY } from "./constants/session.js";
import { PLAN_0 } from "../functions/constants.js";
import load_protected_content from "./methods/load-protected-content.js";
import AdminPanel from "./screens/AdminPanel.svelte";
import ConfirmSignUp from "./screens/ConfirmSignUp.svelte";
import Index from "./screens/Index.svelte";
import ImageAnnotation from "./screens/ImageAnnotation.svelte";
import InactiveAccount from "./screens/InactiveAccount.svelte";
import ManageTeam from "./screens/ManageTeam.svelte";
import NotFound from "./screens/NotFound.svelte";
import SignUp from "./screens/SignUp.svelte";
import SignUpSuccess from "./screens/SignUpSuccess.svelte";

let logged_user;
let user_session;
let hasAuthenticated = false;
let protected_content;

protectedContent.subscribe((value) => {
  protected_content = value;
});

session.subscribe((value) => {
  user_session = value;
});

user.subscribe((value) => {
  logged_user = value;
});

function confirm_navigation() {
  isLoading.set(false);

  return true;
}

async function get_user_from_session_storage() {
  const sessionStorage = window.sessionStorage.getItem(STORAGE_KEY);

  if (!sessionStorage) return false;

  const { email, password } = JSON.parse(sessionStorage);

  try {
    const user = await user_session.login(email, password);

    return user;
  } catch (err) {
    window.sessionStorage.removeItem(STORAGE_KEY);

    isLoading.set(false);

    return false;
  }
}

async function init_authentication() {
  isLoading.set(true);

  const response = await new GoTrue.default({
    APIUrl: "https://app.postscriptmedical.com/.netlify/identity",
    setCookie: true,
  });

  if (!response) {
    isLoading.set(false);

    return true;
  }

  session.set(response);

  user.set(
    await (get_user_from_session_storage() || user_session.currentUser())
  );

  emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");

  hasAuthenticated = true;
}

function is_user_dm() {
  if (protected_content && protected_content.role === "dm")
    return confirm_navigation();

  return redirectTo("#/");
}

async function is_user_logged_in() {
  if (!hasAuthenticated) await init_authentication();

  isLoading.set(true);

  if (logged_user) {
    if (!protected_content) {
      await load_protected_content(logged_user);
    }

    return confirm_navigation();
  }

  return redirectTo("#/");
}

function is_subscription_valid() {
  if (protected_content.team.organization.subscriptionLevel === PLAN_0) {
    return redirectTo("#/inactive-account");
  }

  return confirm_navigation();
}

function redirectTo(path) {
  push(path);

  isLoading.set(false);

  return false;
}

export default {
  "/": wrap({
    component: Index,
    conditions: [
      async () => {
        if (!hasAuthenticated) await init_authentication();

        if (!logged_user) return confirm_navigation();

        return redirectTo("#/annotate");
      },
    ],
  }),
  "/admin": wrap({
    component: AdminPanel,
    conditions: [is_user_logged_in, is_user_dm],
  }),
  "/annotate": wrap({
    component: ImageAnnotation,
    conditions: [is_user_logged_in, is_subscription_valid],
  }),
  "/confirm-signup": wrap({
    component: ConfirmSignUp,
    conditions: [
      async ({ querystring }) => {
        if (!hasAuthenticated) await init_authentication();

        const searchParams = new URLSearchParams(querystring);
        const token = searchParams.get("token");

        if (token) {
          return confirm_navigation();
        }

        redirectTo("#/");
      },
    ],
  }),
  "/inactive-account": wrap({
    component: InactiveAccount,
    conditions: [is_user_logged_in],
  }),
  "/manage-team": wrap({
    component: ManageTeam,
    conditions: [is_user_logged_in],
  }),
  "/sign-up": wrap({
    component: SignUp,
    conditions: [
      async () => {
        if (!hasAuthenticated) await init_authentication();

        return confirm_navigation();
      },
    ],
  }),
  "/success": wrap({
    component: SignUpSuccess,
    conditions: [
      async () => {
        if (!hasAuthenticated) await init_authentication();

        if (logged_user) {
          return redirectTo("#/annotate");
        }

        return confirm_navigation();
      },
    ],
  }),
  "*": wrap({
    component: NotFound,
  }),
};
