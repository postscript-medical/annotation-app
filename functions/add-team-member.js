const fetch = require('node-fetch');
const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body }, context) => {
  const { identity } = context.clientContext;
  const { email, firstName, lastName, password, role, teamID } = JSON.parse(body)

  const response = await fetch(`${identity.url}/admin/users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${identity.token}` },
    body: JSON.stringify({ email, password, confirm: true }),
  })
  .catch(error => {
    return {
      statusCode: 400,
      body: `Error creating user: ${error}`,
    };
  });

  if (!response) return {
    statusCode: 400,
    body: JSON.stringify({ message: 'No user created' }),
  };

  const data = await response.json();

  if (`${data.code}`[0] === '4' ) {
    return {
      statusCode: data.code,
      body: JSON.stringify({ message: data.msg }),
    };
  };

  // TODO: Handle error
  // Add the user to the database
  await faunaFetch({
    query: `
      mutation (
          $email: String!
          $role: String!
          $netlifyID: ID!
          $lastName: String
          $firstName: String
          $teamID: ID!
        ) {
        createUser(data: {
          email: $email
          role: $role
          netlifyID: $netlifyID
          lastName: $lastName
          firstName: $firstName
          team: { connect: $teamID }
          showTutorial: true
        }) {
          _id
        }
      }
    `,
    variables: {
      email,
      role,
      netlifyID: data.id,
      lastName,
      firstName,
      teamID,
    }
  });

  return {
    statusCode: 204,
  };
};