const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body }) => {
  const { name, teamID } = JSON.parse(body);

  try {
    await faunaFetch({
      query: `
        mutation (
          $name: String!
          $teamID: ID!
        ) {
          updateTeam (
            id: $teamID
            data: {
              name: $name
            }
          ) {
            organization {
              stripeID
            }
            members {
              data {
                netlifyID
              }
            }
            name
          }
        }
      `,
      variables: {
        name,
        teamID,
      }
    });

    return {
      statusCode: 204,
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`;
    };
  };
};