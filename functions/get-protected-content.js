
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
              _id
              name
              members {
                data {
                  _id
                  netlifyID
                  email
                  firstName
                  lastName
                  role
                }
              }
              organization {
                _id
                maxSpecialties
                maxUsers
                name
                specialties {
                  data {
                    name
                    subSpecialties {
                      data {
                        name
                        illustrations(_size: 500) {
                          data {
                            name
                            src
                            default_illustration
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