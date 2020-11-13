const fetch = require('node-fetch');
const { faunaFetch } = require('./utils/fauna');
// const faunadb = require('faunadb');
// const q = faunadb.query;
// const client = new faunadb.Client({ secret: process.env.FAUNA_SERVER_KEY })

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;
  const { email, firstName, lastName, password, role, teamID } = JSON.parse(event.body)

  try {
    const response = await fetch(`${identity.url}/admin/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${identity.token}` },
      body: JSON.stringify({ email, password, confirm: true }),
    })
    .catch(error => {
      return {
        statusCode: 400,
        body: `Error creating user: ${error}`
      };
    });

    if (!response) return {
      statusCode: 400,
      body: 'No user created'
    };

    const createdUser = await response.json();

    console.log('Created user:');
    console.log(JSON.stringify({ createdUser }));

    // Create entry in FaunaDB

    // create a new user in the selected team
    await faunaFetch({
      query: `
        mutation ($email: String! $role: String! $netlifyID: ID! $lastName: String $firstName: String $teamID: ID!) {
          createUser(data: {
            email: $email
            role: $role
            netlifyID: $netlifyID
            lastName: $lastName
            firstName: $firstName
            team: { connect: teamID }
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