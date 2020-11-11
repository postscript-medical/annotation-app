
const { faunaFetch } = require('./utils/fauna');

exports.handler = async (_, context) => {
  const { user } = context.clientContext;

  try {
    const result = await faunaFetch({
      query: `
        query ($netlifyID: ID!) {
          findUserByNetlifyID(netlifyID: $netlifyID) {
            showTutorial
            role
            team {
              name
              members {
                data {
                  email
                  firstName
                  lastName
                  role
                }
              }
              organization {
                maxSpecialties
                maxUsers
                name
                specialties {
                  data {
                    name
                    subSpecialties {
                      data {
                        name
                        illustrations {
                          data {
                            name
                            src
                          }
                        }
                      }
                    }
                  }
                }
                stripeID
                subscriptionLevel
              }
            }
          }
        }
      `,
      variables: {
        netlifyID: user.sub
      }
    });

    // if (!subscription || !subscriptionContent) {
    //   return {
    //     statusCode: 402,
    //     body: JSON.stringify({
    //       copy: 'Not allowed.'
    //     })
    //   }
    // }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...result.data.findUserByNetlifyID,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`
    }
  };
};