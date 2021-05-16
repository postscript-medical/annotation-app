const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const { faunaFetch } = require('./utils/fauna');

exports.handler = async ({ body, headers, httpMethod }) => {
  console.log("handle-subscription-creation");
  if (httpMethod !== "POST") {
    return {
      statusCode: 200,
      headers,
      body: `This was not a POST request`,
    };
  }

  try {
    // make sure this event was sent legitimately.
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SUBSCRIPTION_CREATION
    );

    console.log("handle subscription creation event::", stripeEvent.type);
    console.log("StripeEvent", stripeEvent);

    // bail if this is not the event we are after
    if (stripeEvent.type !== "checkout.session.completed")
      return {
        statusCode: 200,
        headers,
        body: "Not the desired event",
      };

    // Check the payment was successful and update faunaDB accordingly

    return {
      statusCode: 200,
      body: `{ received: true }`,
    };
  } catch (error) {
    console.log(`Stripe webhook failed with ${error}`);

    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
