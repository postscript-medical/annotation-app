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
    console.log("StripeEvent:", stripeEvent);

    const eventData = stripeEvent.data.object;

    // bail if this is not the event we are after
    if (
      stripeEvent.type !== "checkout.session.completed" ||
      !eventData ||
      !eventData.customer
    ) {
      return {
        statusCode: 200,
        headers,
        body: "Not the desired event",
      };
    }

    const subscription = await stripe.subscriptions.retrieve(
      eventData.subscription
    );

    console.log("Subrscription details:", subscription);

    // Check the payment was successful and update faunaDB accordingly

    // findOrganisationByEmail
    // const organization = await faunaFetch({
    //   query: `
    //     query ($email: String!) {
    //       findOrganizationByEmail (email: $email) {
    //         _id
    //       }
    //     }
    //   `,
    //   variables: {
    //     email: subscription.customer_email
    //   }
    // })

    // add stripeId to faunaDB from

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
