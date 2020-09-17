const content = {
  individual: {
    copy: 'Individual level',
  },
  department: {
    copy: 'Department level',
  },
  organization: {
    copy: 'Organization level',
  }
};

exports.handler = async (event, context) => {
  const { subscriptionLevels } = JSON.parse(event.body);
  const { user } = context.clientContext;
  const subscription = user ? user.app_metadata.roles[0] : false;
  const allowedSubscription = content[subscription]


  if (!subscription || !allowedSubscription) {
    return {
      statusCode: 402,
      body: JSON.stringify({
        copy: 'Not allowed.'
      })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(allowedSubscription),
  };
};