/*global emailjs*/
/*eslint no-undef: "error"*/
import GoTrue from "gotrue-js";
import { wrap } from "svelte-spa-router/wrap";
import { push } from "svelte-spa-router";
import { user, isLoading, session, protectedContent } from "./stores";
import { STORAGE_KEY } from "./constants/session.js";
import load_protected_content from "./methods/load-protected-content.js";
import Index from "./screens/Index.svelte";
import ImageAnnotation from "./screens/ImageAnnotation.svelte";
import ManageTeam from "./screens/ManageTeam.svelte";

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
    APIUrl: "https://boring-wozniak-bbc476.netlify.app/.netlify/identity",
    setCookie: true,
  });

  if (!response) {
    isLoading.set(false);

    return;
  }

  session.set(response);

  user.set(
    await (get_user_from_session_storage() || user_session.currentUser())
  );

  emailjs.init("user_pIX50wPynL3SZeFTG0Zqn");

  isLoading.set(false);

  hasAuthenticated = true;
}

async function is_user_logged_in() {
  if (!hasAuthenticated) await init_authentication();

  isLoading.set(true);

  if (logged_user) {
    if (!protected_content) await load_protected_content(logged_user);

    isLoading.set(false);

    return true;
  }

  push("/");

  return false;
}

export default {
  "/": wrap({
    component: Index,
    conditions: [
      async () => {
        if (!hasAuthenticated) await init_authentication();

        if (!logged_user) return true;

        push("/annotate");

        return false;
      },
    ],
  }),
  "/annotate": wrap({
    component: ImageAnnotation,
    conditions: [is_user_logged_in],
  }),
  "/manage-team": wrap({
    component: ManageTeam,
    conditions: [is_user_logged_in],
  }),
};
