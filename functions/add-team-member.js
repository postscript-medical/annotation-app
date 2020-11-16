const fetch = require('node-fetch');
const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body }, context) => {
  const { identity } = context.clientContext;
  const { email, firstName, lastName, password, role, teamID } = JSON.parse(body)

  try {
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

    const createdUser = await response.json();

    if (`${createdUser.code}`[0] === '4' ) {
      return {
        statusCode: 400,
        body: 'No user created'
      }
    };

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
        netlifyID: createdUser.id,
        lastName,
        firstName,
        teamID,
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
  };
};