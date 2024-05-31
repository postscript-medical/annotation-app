const fetch = require("node-fetch");

module.exports = async function netlifyCreateUser(
  url,
  token,
  email,
  password,
  confirm = false
) {
  /* This function only works when deployed to a server */
  return fetch(`${url}/admin/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, password, confirm }),
  }).catch((error) => {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Error creating user: ${error}` }),
    };
  });
};
