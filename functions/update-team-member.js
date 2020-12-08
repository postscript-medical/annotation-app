const fetch = require('node-fetch');
const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body }, context) => {
  const { identity } = context.clientContext;
  const { email, firstName, lastName, role, netlifyID, userID, teamID } = JSON.parse(body);

  const response = await fetch(`${identity.url}/admin/users/${netlifyID}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${identity.token}` },
    body: JSON.stringify({ app_metadata: { roles: [role] } })
  })
  .catch(error => {
    return {
      statusCode: 400,
      body: `Error updating user: ${error}`,
    };
  });

  if (!response) return {
    statusCode: 400,
    body: JSON.stringify({ message: 'No user updated' }),
  };

  const data = await response.json();

  if (`${data.code}`[0] === '4' ) {
    return {
      statusCode: data.code,
      body: JSON.stringify({ message: data.msg }),
    };
  };

  // TODO: handle error
  // Update the user in the database
  await faunaFetch({
    query: `
        mutation (
          $userID: ID!
          $email: String!
          $role: String!
          $netlifyID: ID!
          $lastName: String
          $firstName: String
          $teamID: ID!
        ) {
        updateUser(
          id: $userID
          data: {
            email: $email
            role: $role
            netlifyID: $netlifyID
            lastName: $lastName
            firstName: $firstName
            team: { connect: $teamID }
            showTutorial: true
          }
        ) {
          _id
        }
      }
    `,
    variables: {
      email,
      firstName,
      lastName,
      role,
      netlifyID,
      userID,
      teamID,
    }
  });

  return {
    statusCode: 204,
  };
};