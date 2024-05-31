const fetch = require("node-fetch");

module.exports = async function netlifyUpdateUserRole(url, token, id, role) {
  /* This function only works when deployed to a server */
  try {
    return fetch(`${url}/admin/users/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ app_metadata: { roles: [role] } }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Updated a user! 204!");
        console.log(JSON.stringify({ data }));
        return { statusCode: 204 };
      })
      .catch((error) => {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: `Error updating user: ${error}` }),
        };
      });
  } catch (error) {
    return error;
  }
};
