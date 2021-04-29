const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async ({ body, headers }) => {
  console.log("request body", body);
  try {
    // make sure this event was sent legitimately.
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("handle subscription creation event:", stripeEvent.type);

    // bail if this is not a subscription update event
    if (stripeEvent.type !== "checkout.session.completed") return;

    console.log("handle subscription creation data:", stripeEvent.data);

    return {
      statusCode: 200,
      body: `{ received: true }`,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
