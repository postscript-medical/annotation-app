const fetch = require("node-fetch");

module.exports = function deleteNetlifyUser(url, token, netlifyId) {
  return fetch(`${url}/admin/users/${netlifyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch((error) => {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Error deleting user: ${error}` }),
    };
  });
};
