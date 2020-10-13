const { PROTECTED_CONTENT } = require('./constants');

exports.handler = async (event, context) => {
  // const { subscriptionLevels } = JSON.parse(event.body);
  const { user } = context.clientContext;
  const subscription = user ? user.app_metadata.roles[0] : false; /* the assumption for now is that a user will only have a single role associated with it */
  const subscriptionContent = PROTECTED_CONTENT[subscription]

  console.log('getProtectedContent <<<<<<<<<<<<<<<<<<<<');
  // console.log('subscriptionLevels:', subscriptionLevels);
  console.log('user:', user);
  console.log('subscription:', subscription);
  console.log('subscriptionContent:', subscriptionContent);


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
    body: JSON.stringify(subscriptionContent),
  };
};