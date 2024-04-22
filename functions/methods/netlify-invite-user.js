const fetch = require("node-fetch");

module.exports = async function netlifyInviteUser(url, token, email) {
  /* This function only works when deployed to a server */
  return fetch(`${url}/invite`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email }),
  }).catch((error) => {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Error creating user: ${error}` }),
    };
  });
};
