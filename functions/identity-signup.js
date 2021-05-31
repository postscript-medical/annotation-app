const { faunaFetch } = require("./utils/fauna");

// TODO: Remove unused environment keys from Netlify

exports.handler = async (event) => {
  const { user } = JSON.parse(event.body);
  const role = "owner";

  // Create a brand new organization in Fauna
  await faunaFetch({
    query: `
      mutation ($email: String! $netlifyID: ID! $stripeID: ID! $role: String!) {
        createOrganization(data: {
          maxSpecialties: 1
          maxUsers: 1
          name: "My organization"
          stripeID: $stripeID
          email: $email
          subscriptionLevel: "inactive"
          teams: {
            create: [{
              name: "My team",
              members: {
                create: [{
                  email: $email
                  netlifyID: $netlifyID
                  role: $role
                  showTutorial: true
                }]
              }
            }]
          }
        }) {
          _id
          name
        }
      }
    `,
    variables: {
      email: user.email,
      netlifyID: user.id,
      stripeID: "",
      role: role,
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles: [role],
      },
    }),
  };
};
