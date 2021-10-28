import netlifyFunction from "./netlify-function";

export default async function (user) {
  return netlifyFunction("/.netlify/functions/get-management-data", user, {});
}
