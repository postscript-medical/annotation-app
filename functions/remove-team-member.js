const fetch = require('node-fetch');
const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body }, context) => {
  const { identity } = context.clientContext;
  const { netlifyID, userID } = JSON.parse(body);

  try {
    const response = await fetch(`${identity.url}/admin/users/${netlifyID}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${identity.token}` },
    })
    .catch(error => {
      return {
        statusCode: 400,
        body: `Error deleting user: ${error}`,
      };
    })

    if (!response) return {
      statusCode: 400,
      body: 'No user deleted'
    };

    // TODO: delete the entry from FaunaDB
    await faunaFetch({
      query: `mutation ($userID:ID!) {
        deleteUser(id: $userID) {
          _id
        }
      }`,
      variables: {
        userID
      }
    });

    return {
      statusCode: 204,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
}