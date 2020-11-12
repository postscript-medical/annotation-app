exports.handler = async (event, context) => {
  try {
    console.log('EVENT', event);
    console.log('CONTEXT', context);

    return {
      statusCode: 200,
      body: `{ received: true }`,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  };
};