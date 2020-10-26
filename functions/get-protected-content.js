
const { faunaFetch } = require('./utils/fauna');
const { PROTECTED_CONTENT } = require('./constants');

exports.handler = async (event, context) => {
  const { subscriptionLevels } = JSON.parse(event.body);
  const { user } = context.clientContext;
  const subscription = user ? user.app_metadata.roles[0] : false; /* the assumption for now is that a user will only have a single role associated with it */
  const subscriptionContent = PROTECTED_CONTENT[subscription];

  try {
    console.log('userId', user);
    const result = await faunaFetch({
      query: `
        query ($netlifyID: ID!) {
          getUserByNetlifyID(netlifyID: $netlifyID) {
            firstName
            showTutorial
            subscriptionActive
          }
        }
      `,
      variables: {
        netlifyID: user.sub
      }
    });

    console.log('Result', result);
    
    if (!subscription || !subscriptionContent) {
      return {
        statusCode: 402,
        body: JSON.stringify({
          copy: 'Not allowed.'
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: result.data.getUserByNetlifyID,
        subscription: subscriptionContent
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`
    }
  };



};