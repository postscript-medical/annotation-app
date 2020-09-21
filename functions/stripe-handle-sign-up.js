const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body, headers }, context) => {
  let event;
  try {
    // make sure this event was sent legitimately.
    event = stripe.webhooks.constructEvent(
      body,
      headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }
  catch (error) {
    console.log(error);
    console.log(`⚠️  Webhook signature verification failed.`);
    console.log(`⚠️  Check the env file and enter the correct webhook secret.`);

    return {
      statusCode: 400,
      body: `Webhook error ${error.message}`,
    }
  };

  // Extract the object from the event.
  const dataObject = event.data.object;

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  }
};