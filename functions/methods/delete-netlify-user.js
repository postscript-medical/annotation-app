const fetch = require("node-fetch");

module.exports = function deleteNetlifyUser(url, token, netlifyID) {
  return fetch(`${url}/admin/users/${netlifyID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
};
