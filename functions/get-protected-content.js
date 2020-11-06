
const { faunaFetch } = require('./utils/fauna');
// const { PROTECTED_CONTENT } = require('./constants');

exports.handler = async (_, context) => {
  // const { subscriptionLevels } = JSON.parse(event.body);
  const { user } = context.clientContext;
  // const subscription = user ? user.app_metadata.roles[0] : false; /* the assumption for now is that a user will only have a single role associated with it */
  // const subscriptionContent = PROTECTED_CONTENT[subscription];

  console.log('user', user);

  try {
    const result = await faunaFetch({
      query: `
        query ($netlifyID: ID!) {
          findUserByNetlifyID(netlifyID: $netlifyID) {
            showTutorial
            role
            team {
              organization {
                maxSpecialties
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